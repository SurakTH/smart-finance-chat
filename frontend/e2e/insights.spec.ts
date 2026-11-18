import {test,expect} from '@playwright/test';
import {signIn} from './auth';

test('simple insights aggregate all entries, filter, compare and drill through on both sizes',async({page},info)=>{
 await signIn(page);
 const headers={'X-SF-Request':'1'};
 const created=await page.request.post('/api/workspaces',{headers,data:{name:'วิเคราะห์ทดสอบ '+info.project.name+' '+Date.now()}});
 expect(created.ok()).toBe(true);const {id}=await created.json(),base=`/api/workspaces/${id}`;
 const accounts=await (await page.request.get(base+'/accounts')).json();
 const wallet=accounts.find((a:any)=>a.kind==='asset'),expense=accounts.find((a:any)=>a.kind==='expense'),income=accounts.find((a:any)=>a.kind==='income');
 for(const [kind,amount,day,description] of [['expense',1000,'2026-10-01','อาหารหนึ่ง'],['expense',5000,'2026-10-02','อาหารสอง'],['income',20000,'2026-10-02','เงินเข้า'],['expense',3000,'2026-09-30','ช่วงก่อน']] as const){
  const r=await page.request.post(base+'/transactions',{headers,data:{kind,amount,occurred_on:day,description,account_id:wallet.id,category_id:kind==='expense'?expense.id:income.id,idempotency_key:crypto.randomUUID()}});expect(r.ok()).toBe(true);
 }
 await page.goto('/insights?workspace='+id);
 await expect(page.getByRole('heading',{name:'วิเคราะห์',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'เลือกวัน',exact:true}).click();
 await page.getByLabel('วันเริ่มวิเคราะห์',{exact:true}).fill('2026-10-01');
 await page.getByLabel('วันสิ้นสุดวิเคราะห์',{exact:true}).fill('2026-10-03');
 await expect(page.locator('.insight-metrics').getByRole('link').first()).toContainText('฿60.00');
 await expect(page.locator('.insight-metrics')).toContainText('฿200.00');
 await expect(page.locator('.insight-metrics')).toContainText('฿20.00');
 await expect(page.locator('.insight-story')).toContainText('2 รายการจ่าย');
 await expect(page.locator('.insight-largest a')).toHaveCount(2);
 await page.getByRole('button',{name:'ใช้กับอะไร',exact:true}).click();
 await expect(page.locator('.insight-category-changes')).toContainText('เพิ่มขึ้น ฿30.00');
 await page.getByRole('button',{name:'ใช้บัญชีไหน',exact:true}).click();
 await expect(page.locator('.insight-ranking')).toContainText(wallet.name);
 await page.getByRole('button',{name:'แนวโน้ม',exact:true}).click();
 await expect(page.locator('.insight-months')).toContainText('จ่าย ฿60.00');
 await expect(page.locator('.insight-weekdays>div')).toHaveCount(7);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`../artifacts/insights-${info.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'สรุปง่าย ๆ',exact:true}).click();
 await page.getByRole('button',{name:'ตัวกรอง',exact:true}).click();
 await page.getByLabel('หมวดที่วิเคราะห์').selectOption(expense.id);
 await expect(page.locator('.insight-metrics')).toContainText('฿60.00');
 await expect(page.locator('.insight-metrics').getByRole('link').nth(1)).toContainText('฿0.00');
 await page.getByRole('link',{name:/ดูรายการหมวดนี้/}).click();
 await expect(page).toHaveURL(/transactions\?.*category_id=/);
 await expect(page.locator('.ledger-row')).toHaveCount(2);
 await expect(page.getByLabel('วันเริ่มต้น')).toHaveValue('2026-10-01');
 await expect(page.locator('.filtered-totals')).toContainText('฿60.00');
});

test('default transaction controls leave room for real rows and retain advanced options',async({page})=>{
 await signIn(page);await page.goto('/transactions');
 await expect(page.locator('.ledger-row').first()).toBeVisible();
 await expect(page.getByLabel('วันเริ่มต้น')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'ส่งออก CSV',exact:true})).toHaveCount(0);
 await expect(page.locator('.ledger-row').first()).toBeInViewport();
 await page.getByRole('button',{name:'ตัวกรอง',exact:true}).click();
 await expect(page.getByLabel('วันเริ่มต้น')).toBeVisible();
 await expect(page.getByRole('button',{name:'ส่งออก CSV',exact:true})).toBeVisible();
});

test('yesterday and this week follow Bangkok dates across the Sunday–Monday boundary',async({page})=>{
 await signIn(page);
 // Sunday in UTC, but Monday just after midnight in Bangkok.
 await page.clock.setFixedTime(new Date('2026-11-01T17:05:00Z'));
 await page.goto('/insights');
 await expect(page.getByRole('heading',{name:'วิเคราะห์',exact:true})).toBeVisible();

 async function selectRange(label:string,start:string,end:string){
  const responsePromise=page.waitForResponse(response=>{
   const url=new URL(response.url());
   return url.pathname.endsWith('/insights') &&
    url.searchParams.get('start')===start && url.searchParams.get('end')===end;
  });
  const button=page.getByRole('button',{name:label,exact:true});
  await button.click();
  const response=await responsePromise;
  expect(response.ok()).toBe(true);
  await expect(button).toHaveAttribute('aria-pressed','true');
  const link=page.locator('.insight-metrics').getByRole('link',{name:/ใช้ไปทั้งหมด/});
  await expect(link).toHaveAttribute('href',new RegExp(`start=${start}&end=${end}`));
  return response.json();
 }

 const yesterday=await selectRange('เมื่อวาน','2026-11-01','2026-11-01');
 expect(yesterday.previous).toMatchObject({start:'2026-10-31',end:'2026-10-31'});
 const monday=await selectRange('สัปดาห์นี้','2026-11-02','2026-11-02');
 expect(monday.days).toBe(1);

 await page.clock.setFixedTime(new Date('2026-11-08T16:59:00Z'));
 const sunday=await selectRange('สัปดาห์นี้','2026-11-02','2026-11-08');
 expect(sunday.days).toBe(7);
 expect(sunday.previous).toMatchObject({start:'2026-10-26',end:'2026-11-01'});
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
