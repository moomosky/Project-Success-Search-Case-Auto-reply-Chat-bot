const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1ARBZ2KTiXZE2qth9wYpWhkTN2rUuo492pIDQCjixqLI/edit?gid=0#gid=0";
const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
const worksheet = spreadsheet.getSheetByName("Chatlog");

// === BOT status using Script Properties ===
const SCRIPT_PROP = PropertiesService.getScriptProperties();

// คืนค่า true/false ว่าบอทกำลังเปิดอยู่ไหม (ค่าเริ่มต้น: true)
function getBotEnabled() {
  const val = SCRIPT_PROP.getProperty('BOT_ENABLED');
  return val === null ? true : val === 'true';
}

// ตั้งค่าเปิด/ปิดบอท
function setBotEnabled(isOn) {
  SCRIPT_PROP.setProperty('BOT_ENABLED', isOn ? 'true' : 'false');
  return getBotEnabled();
}

// ADMIN เท่านั้นที่อนุญาตให้สั่งเปิด/ปิด
function setBotStatusByAdmin(username, isOn) {
  if (username !== 'ADMIN') {
    throw new Error('Only ADMIN can change bot status.');
  }
  const newVal = setBotEnabled(!!isOn);
  // บันทึกแจ้งเตือนลงแชทแบบ SYSTEM
  worksheet.appendRow([new Date().toString(), "แจ้งเตือน", "ระบบตอบกลับ" + (newVal ? "ถูก✅" : "ถูก❌") + " by ADMIN"]);
  return newVal;
}

// ให้ฝั่ง client เรียกดูสถานะปัจจุบันได้
function getBotStatusForClient() {
  return getBotEnabled();
}

// ====== MAIN ======
function doGet() {
  // เคลียร์ข้อมูลเก่าทั้งหมดก่อนทุกครั้ง
  worksheet.clearContents();
  worksheet.appendRow(["เวลา", "ผู้ใช้", "ข้อความ"]);
  worksheet.appendRow([new Date().toString(), "🤖", "สวัสดี ยินดีต้อนรับเข้าสู่ระบบแชท 👋 ต้องการติดตามสถานะเคสงานซ่อม สามารถพิมพ์เลขเคสในช่อง Search Case ID Here ... ด้านบน แล้วกด Search หรือ สามารถพิมพ์ข้อความคำว่า ติดตามสถานะ ตามด้วยเลขเคสได้เลย เช่น สอบถามสถานะ 999 ดังตัวอย่าง"]);

  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('การพัฒนาระบบเว็บแอพพลิเคชั่นอัจฉริยะเพื่อการแจ้งเตือนสถานะและการตอบแชทลูกค้า บริษัท ไฮพอยท์ เซอร์วิส เน็ตเวิร์ค (ประเทศไทย) จำกัด')
    .addMetaTag('viewport', 'width=device-width, inital-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* PROCESS FORM */
function processForm(formObject){  
  var result = "";
  if(formObject.searchtext){
      result = search(formObject.searchtext);
  }
  return result;
}

//SEARCH FOR MATCHED CONTENTS 
function search(searchtext){
  var spreadsheetId = '1ARBZ2KTiXZE2qth9wYpWhkTN2rUuo492pIDQCjixqLI';
  var dataRange     = 'สถานะ!A2:E';
  var data = Sheets.Spreadsheets.Values.get(spreadsheetId, dataRange).values;
  var ar = [];
  
  data.forEach(function(f) {
    if (~f.toString().toLowerCase().indexOf(searchtext.toString().toLowerCase())) {
      ar.push(f);
    }
  });
  return ar;
}

// แชทบอทตอบกลับ
function addNewRowToSheet(username, user_input) {
  // 1) บันทึกข้อความผู้ใช้ก่อน
  worksheet.appendRow([new Date().toString(), username, user_input]);

  // 2) ถ้าเป็น ADMIN -> ไม่ให้บอทตอบกลับข้อความนี้
  if (username === "ADMIN") {
    return;
  }

  // 3) ตรวจว่า "สถานะบอท" เปิดอยู่ไหม ถ้าปิดก็ไม่ตอบ
  if (!getBotEnabled()) {
    return;
  }

  // 4) ตรรกะตอบกลับของบอท
  let botReply = "";

  // 4.1 ทักทาย
  if (user_input.includes("สวัสดีครับ") || user_input.includes("สวัสดีค่ะ") || user_input.includes("สวัสดี")) {
    botReply = "สวัสดีค่ะ ยินดีให้บริการ 🙏";
  }
  // 4.2 ขอบคุณ
  else if (user_input.includes("ขอบคุณ") || user_input.includes("ขอบคุณค่ะ") || user_input.includes("ขอบคุณครับ")) {
    botReply = "ยินดีเสมอ 😊";
  }
  //
  else if (
  user_input.includes("ติด") ||  
  user_input.includes("ติดตาม") ||
  user_input.includes("ตามงาน") ||
  user_input.includes("ตามเคสงาน"))
  {
  botReply = "รบกวนลูกค้าพิมพ์คำว่า ตามเคส ตามด้วยเลขเคสนะครับ เช่น ตามเคส 999 ตามตัวอย่างนะครับ";
}

else if (/^\d+$/.test(user_input.trim())) {
  botReply = "รบกวนลูกค้าพิมพ์คำว่า ตามเคส ตามด้วยเลขเคสนะครับ เช่น ตามเคส 999 ตามตัวอย่างนะครับ 🔎";
}

  // 4.3 ตรวจสอบสถานะเคส
  else if (user_input.includes("สถานะเคส") || 
           user_input.includes("สอบถามสถานะ") ||
           user_input.includes("ติดตามสถานะ") ||
           user_input.includes("ตามเคส")) {
    let caseNumber = user_input.match(/\d+/);
    if (caseNumber) {
      let result = search(caseNumber[0]);
      if (result && result.length > 0) {
        botReply = "📌 สถานะของเคส " + caseNumber[0] + " คือ: " + result[0][4];
      } else {
        botReply = "❌ ไม่พบข้อมูลเคส " + caseNumber[0] + " ในระบบค่ะ";
      }
    } else {
      botReply = "กรุณาระบุหมายเลขเคส เช่น 'สอบถามสถานะเคส 12345' 🔎";
    }
  }

  // 5) ถ้ามีคำตอบ ค่อยเขียนลงชีต
  if (botReply !== "") {
    worksheet.appendRow([new Date().toString(), "🤖", botReply]);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheetData() {
  const AllData = worksheet.getRange("A:C").getValues();
  AllData.shift();
  return AllData.filter(function (el) {
    return el[0] != "";
  });
}