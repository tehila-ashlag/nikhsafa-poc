/**
 * טופס דיווח תקלות – נציגות טלפניות → ספק התוכנה
 * גרסה עם הרשאות מינימליות: רק Forms + Sheets (בלי Drive ובלי שליחת מיילים),
 * כדי לא להקפיץ אימות נוסף של גוגל בזמן אישור ההרשאות.
 *
 * הוראות:
 * 1. פרויקט חדש ב- https://script.google.com (או למחוק את כל הקוד הקודם בפרויקט הקיים).
 * 2. להדביק את הקובץ הזה, לעדכן למטה את המיילים, לשמור (Ctrl+S).
 * 3. לבחור createForm ליד כפתור "הפעלה" (Run), ללחוץ "הפעלה" ולאשר הרשאות.
 *    אם מופיע "Google hasn't verified this app": Advanced ← Go to ... (unsafe).
 * 4. ביומן (Execution log) יופיעו הקישורים.
 *
 * שלבים ידניים אחרי ההרצה (פעם אחת):
 * א. בקישור העריכה להוסיף שאלה מסוג "העלאת קובץ":
 *      כותרת: צילום מסך
 *      תיאור: יש לצלם מסך מלא (כל המסך, לא רק חלק ממנו)
 *      סוגי קבצים: תמונה, עד 5 קבצים
 *      ✅ חובה
 * ב. ב-Google Drive תיווצר תיקייה "משהו לא עובד? (File responses)" –
 *    לשתף אותה עם הספק והמנהל כצופים (כל הצילומים, גם העתידיים, יהיו גלויים להם).
 * ג. התראות במייל: בלשונית "תשובות" ← ⋮ ← "קבלת התראות באימייל על תשובות חדשות"
 *    (כל אחד מהעורכים – את והמנהל – מפעיל לעצמו).
 */

// ===== הגדרות =====
const VENDOR_EMAILS = ['vendor@example.com'];   // ← להחליף במייל של הספק
const MANAGER_EMAILS = ['manager@example.com']; // ← להחליף במייל של המנהל
const FORM_TITLE = 'משהו לא עובד?';

// ===== יצירת הטופס =====
// לנציגה יש רק שני דברים לעשות: לכתוב משפט אחד ולצרף צילום מסך.
// המייל והשעה נרשמים אוטומטית.
function createForm() {
  const form = FormApp.create(FORM_TITLE)
    .setDescription('כותבים משפט אחד, מצרפים צילום של המסך המלא, ושולחים. זהו 🙂')
    .setCollectEmail(true)
    .setProgressBar(false)
    .setShowLinkToRespondAgain(true)
    .setConfirmationMessage('תודה! הדיווח נשלח לספק 🙏');

  form.addParagraphTextItem()
    .setTitle('מה לא עובד?')
    .setHelpText('משפט אחד מספיק')
    .setRequired(true);

  // גיליון תשובות – הספק והמנהל צופים
  const ss = SpreadsheetApp.create(FORM_TITLE + ' – תשובות');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  ss.addViewers(VENDOR_EMAILS.concat(MANAGER_EMAILS));

  // המנהל עורך של הטופס – רואה את לשונית "תשובות" ויכול להפעיל התראות
  form.addEditors(MANAGER_EMAILS);

  Logger.log('✏️ עריכת הטופס (להוסיף שאלת צילום מסך): ' + form.getEditUrl());
  Logger.log('📨 קישור לנציגות: ' + form.getPublishedUrl());
  Logger.log('📊 גיליון תשובות: ' + ss.getUrl());
}
