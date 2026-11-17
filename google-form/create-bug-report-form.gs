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
 *    להוסיף שאלה מסוג "העלאת קובץ" (File upload) בשם "צילומי מסך",
 *    סוגי קבצים: תמונה, עד 5 קבצים, לסמן "חובה".
 */

// ===== הגדרות =====
const VENDOR_EMAILS = ['vendor@example.com'];   // ← להחליף במייל של הספק
const MANAGER_EMAILS = ['manager@example.com']; // ← להחליף במייל של המנהל

// כל מי שצריך לראות את הדיווחים: הספק, המנהל, ומי שהריצה את הסקריפט
function allViewers() {
  const me = Session.getEffectiveUser().getEmail();
  return VENDOR_EMAILS.concat(MANAGER_EMAILS, me ? [me] : []);
}
const FORM_TITLE = 'דיווח תקלה במערכת';

// רשימת המסכים/מודולים – אפשר לערוך חופשי
const SCREENS = [
  'מסך הזמנה חדשה',
  'חיפוש לקוח',
  'כרטיס לקוח',
  'תשלום / סליקה',
  'דוחות',
  'התחברות למערכת',
  'אחר',
];

// ===== יצירת הטופס =====
function createForm() {
  const form = FormApp.create(FORM_TITLE)
    .setDescription('נתקלת במשהו שלא עובד? מלאי את הטופס וצרפי צילום מסך. הדיווח יועבר ישירות לספק התוכנה.')
    .setCollectEmail(true)
    .setProgressBar(false)
    .setConfirmationMessage('תודה! הדיווח התקבל והועבר לספק 🙏');

  form.addTextItem().setTitle('שם הנציגה').setRequired(true);

  form.addListItem()
    .setTitle('באיזה מסך / חלק במערכת?')
    .setChoiceValues(SCREENS)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('מה קרה?')
    .setHelpText('מה ניסית לעשות, ומה קרה בפועל (הודעת שגיאה, מסך תקוע וכו׳)')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('עד כמה זה דחוף?')
    .setChoiceValues([
      'חוסם – אי אפשר לעבוד',
      'מפריע – יש עקיפה',
      'קטן – לידיעה',
    ])
    .setRequired(true);

  form.addDateTimeItem().setTitle('מתי זה קרה? (בערך)').setRequired(false);

  form.addTextItem()
    .setTitle('מספר לקוח / הזמנה (אם רלוונטי)')
    .setRequired(false);

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

  lines.push('<b>מייל המדווחת:</b> ' + e.response.getRespondentEmail());

  if (fileLinks.length) {
    lines.push('<br><b>צילומי מסך:</b>');
    fileLinks.forEach(function (url, i) {
      lines.push('<a href="' + url + '">צילום ' + (i + 1) + '</a>');
    });
  }

  const urgency = lines.find(function (l) { return l.indexOf('דחוף') !== -1; }) || '';
  const prefix = urgency.indexOf('חוסם') !== -1 ? '🔴 [חוסם] ' : '';

  MailApp.sendEmail({
    to: allViewers().join(','),
    subject: prefix + 'דיווח תקלה חדש מהנציגות',
    htmlBody: '<div dir="rtl" style="font-family:Arial">' + lines.join('<br>') + '</div>',
  });
}
