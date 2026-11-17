/**
 * טופס דיווח תקלות – נציגות טלפניות → ספק התוכנה
 *
 * הוראות:
 * 1. להיכנס ל- https://script.google.com וללחוץ "פרויקט חדש".
 * 2. למחוק את מה שיש בעורך ולהדביק את כל הקובץ הזה.
 * 3. לעדכן למטה את VENDOR_EMAILS (המייל/ים של הספק) ואת MANAGER_EMAILS (המנהל/ים).
 *    מי שמריץ את הסקריפט היא בעלת הטופס – רואה הכול ומקבלת גם את המיילים אוטומטית.
 * 4. לבחור בפונקציה createForm מהרשימה למעלה וללחוץ "הפעלה" (Run). לאשר הרשאות.
 * 5. ביומן (Execution log) יופיעו: קישור לעריכת הטופס, קישור למילוי (לשלוח לנציגות) וקישור לגיליון.
 * 6. שלב ידני אחד (גוגל לא מאפשרת ליצור אותו בקוד): לפתוח את קישור העריכה,
 *    להוסיף שאלה מסוג "העלאת קובץ" (File upload) בשם "צילום מסך",
 *    סוגי קבצים: תמונה, עד 5 קבצים.
 */

// ===== הגדרות =====
const VENDOR_EMAILS = ['vendor@example.com'];   // ← להחליף במייל של הספק
const MANAGER_EMAILS = ['manager@example.com']; // ← להחליף במייל של המנהל

// כל מי שצריך לראות את הדיווחים: הספק, המנהל, ומי שהריצה את הסקריפט
function allViewers() {
  const me = Session.getEffectiveUser().getEmail();
  return VENDOR_EMAILS.concat(MANAGER_EMAILS, me ? [me] : []);
}
const FORM_TITLE = 'משהו לא עובד?';

// ===== יצירת הטופס =====
// לנציגה יש רק שני דברים לעשות: לכתוב משפט אחד ולצרף צילום מסך.
// השם/המייל והשעה נרשמים אוטומטית.
function createForm() {
  const form = FormApp.create(FORM_TITLE)
    .setDescription('כותבים משפט אחד, מצרפים צילום מסך, ושולחים. זהו 🙂')
    .setCollectEmail(true)
    .setProgressBar(false)
    .setShowLinkToRespondAgain(true)
    .setConfirmationMessage('תודה! הדיווח נשלח לספק 🙏');

  form.addParagraphTextItem()
    .setTitle('מה לא עובד?')
    .setHelpText('משפט אחד מספיק')
    .setRequired(true);

  // גיליון תשובות + שיתוף עם הספק והמנהל
  const ss = SpreadsheetApp.create(FORM_TITLE + ' – תשובות');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  ss.addViewers(VENDOR_EMAILS.concat(MANAGER_EMAILS));

  // המנהל גם עורך של הטופס – כך יראה את לשונית "תשובות" ויוכל לשנות שאלות
  form.addEditors(MANAGER_EMAILS);

  // התראה במייל לספק על כל דיווח חדש
  ScriptApp.newTrigger('onSubmit').forForm(form).onFormSubmit().create();

  Logger.log('✏️ עריכת הטופס: ' + form.getEditUrl());
  Logger.log('📨 קישור לנציגות: ' + form.getPublishedUrl());
  Logger.log('📊 גיליון תשובות (שותף עם הספק והמנהל): ' + ss.getUrl());
}

// ===== נשלח אוטומטית בכל הגשה =====
function onSubmit(e) {
  const lines = [];
  const fileLinks = [];

  e.response.getItemResponses().forEach(function (r) {
    const item = r.getItem();
    const answer = r.getResponse();

    if (item.getType() === FormApp.ItemType.FILE_UPLOAD) {
      // נותן לספק ולמנהל הרשאת צפייה בכל צילום מסך
      answer.forEach(function (fileId) {
        const file = DriveApp.getFileById(fileId);
        file.addViewers(VENDOR_EMAILS.concat(MANAGER_EMAILS));
        fileLinks.push(file.getUrl());
      });
    } else {
      lines.push('<b>' + item.getTitle() + ':</b> ' + answer);
    }
  });

  lines.push('<b>נשלח על ידי:</b> ' + e.response.getRespondentEmail());
  lines.push('<b>מתי:</b> ' + Utilities.formatDate(e.response.getTimestamp(), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm'));

  if (fileLinks.length) {
    lines.push('<br><b>צילומי מסך:</b>');
    fileLinks.forEach(function (url, i) {
      lines.push('<a href="' + url + '">צילום ' + (i + 1) + '</a>');
    });
  }

  MailApp.sendEmail({
    to: allViewers().join(','),
    subject: 'דיווח תקלה חדש מהנציגות',
    htmlBody: '<div dir="rtl" style="font-family:Arial">' + lines.join('<br>') + '</div>',
  });
}
