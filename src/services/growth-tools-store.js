// ecos — curated local reference catalog of ecosystem growth opportunities
// (קולות קוראים, מענקים, פיילוטים, תוכניות האצה וכו').
// This is a static demo reference list, NOT a live feed: no eligibility
// checks, no scraping, no external API/LinkedIn integration, no automatic
// application. Deliberately separate from NeedsStore — these are
// programs/resources, not needs/gaps, and are not matched against company
// data by any algorithm in v1.
// localStorage-only convention reserved for a future local overlay; v1 is
// read-only seed data (nothing is written yet).

(function () {
  if (window.GrowthToolsStore) return;

  const STORAGE_KEY = "ecosystemOS.growthTools.v1"; // reserved, unused in v1

  const SEED = [
    {
      id: "gt-innovation-authority-calls",
      title: "רשות החדשנות — קולות קוראים",
      provider: "רשות החדשנות",
      category: "קולות קוראים",
      type: "call",
      description: "קולות קוראים תקופתיים למענקי מו״פ ותמיכה בחברות טכנולוגיה, כולל מסלולים ייעודיים לתעשיות חלל ובטחוניות.",
      stageFit: "כל השלבים",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["מענק", "ממשלתי"],
    },
    {
      id: "gt-rnd-grants",
      title: "מענקי מו״פ",
      provider: "רשות החדשנות",
      category: "מענקים",
      type: "grant",
      description: "מענקים לא-דיליוטיביים למחקר ופיתוח טכנולוגי, בדרך כלל בשיעור מימון חלקי מתקציב הפרויקט.",
      stageFit: "Seed ואילך",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["מענק", "מו״פ"],
    },
    {
      id: "gt-seed-tracks",
      title: "מסלולי הזנק",
      provider: "רשות החדשנות",
      category: "מימון מוקדם",
      type: "grant",
      description: "מסלולי תמיכה לחברות בשלב מוקדם מאוד, לרוב לפני גיוס משמעותי, לצורך הוכחת היתכנות טכנולוגית.",
      stageFit: "רעיון / Seed מוקדם",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["מענק", "שלב מוקדם"],
    },
    {
      id: "gt-gov-pilots",
      title: "פיילוטים בחברות ממשלתיות",
      provider: "גופים ממשלתיים",
      category: "פיילוטים",
      type: "pilot",
      description: "מסגרות פיילוט מול חברות וגופים ממשלתיים, לבחינת פתרון בסביבת לקוח אמיתית לפני רכש מלא.",
      stageFit: "לאחר Seed",
      sectorFit: "לפי הגוף המארח",
      url: null,
      isDemo: true,
      tags: ["פיילוט", "ממשלתי"],
    },
    {
      id: "gt-intl-collab",
      title: "שיתופי פעולה בינלאומיים",
      provider: "גופים בינלאומיים",
      category: "שת״פ בינלאומי",
      type: "network",
      description: "תוכניות שת״פ מחקר ופיתוח משותפות עם גופים וסוכנויות חלל בחו״ל, כולל מימון משותף לפרויקטים דו-לאומיים.",
      stageFit: "כל השלבים",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["שת״פ", "בינלאומי"],
    },
    {
      id: "gt-regulatory-sandbox",
      title: "Regulatory Sandbox",
      provider: "רגולטורים ענפיים",
      category: "רגולציה",
      type: "regulatory",
      description: "מסגרת בקרה מוגבלת בזמן לבדיקת טכנולוגיה או שירות חדש בסביבה רגולטורית מפוקחת, לפני עמידה מלאה בדרישות.",
      stageFit: "לאחר הוכחת היתכנות",
      sectorFit: "תלוי תחום רגולטורי",
      url: null,
      isDemo: true,
      tags: ["רגולציה"],
    },
    {
      id: "gt-snc-finder",
      title: "Startup Nation Central / Finder",
      provider: "Startup Nation Central",
      category: "חיבורי אקוסיסטם",
      type: "network",
      description: "מאגר וכלי חיפוש להיכרות עם אקוסיסטם ההייטק הישראלי, לרוב משמש גופים בחו״ל לאיתור חברות ישראליות.",
      stageFit: "כל השלבים",
      sectorFit: "כל תחומי ההייטק",
      url: null,
      isDemo: true,
      tags: ["נראות", "רשת קשרים"],
    },
    {
      id: "gt-export-institute",
      title: "מכון היצוא",
      provider: "מכון היצוא הישראלי",
      category: "יצוא",
      type: "market",
      description: "ליווי חברות בתהליכי חדירה לשווקים בינלאומיים, כולל משלחות, תערוכות ומידע על שווקי יעד.",
      stageFit: "מוצר בשל ליצוא",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["יצוא", "שווקים"],
    },
    {
      id: "gt-academia",
      title: "שיתופי פעולה עם אקדמיה",
      provider: "מוסדות אקדמיים",
      category: "אקדמיה",
      type: "network",
      description: "שיתופי מחקר, גישה לציוד מעבדתי ולכוח אדם מחקרי, ולעיתים גם למסגרות תמריצים למחקר משותף.",
      stageFit: "כל השלבים",
      sectorFit: "תלוי תחום מחקר",
      url: null,
      isDemo: true,
      tags: ["מחקר", "אקדמיה"],
    },
    {
      id: "gt-open-labs",
      title: "מעבדות פתוחות",
      provider: "מרכזי חדשנות",
      category: "תשתיות",
      type: "infrastructure",
      description: "גישה לתשתית בדיקות וייצור משותפת (Fab-lab, מעבדות בדיקה סביבתית וכד׳) ללא צורך בהשקעת הון עצמי.",
      stageFit: "כל השלבים",
      sectorFit: "מוצרי חומרה בעיקר",
      url: null,
      isDemo: true,
      tags: ["תשתיות", "חומרה"],
    },
    {
      id: "gt-accelerators",
      title: "תוכניות האצה",
      provider: "מאיצים פרטיים וממשלתיים",
      category: "האצה",
      type: "accelerator",
      description: "תוכניות מובנות בנות מספר חודשים הכוללות ליווי, חיבורי רשת ולעיתים מימון ראשוני תמורת נתח מניות.",
      stageFit: "Seed – Series A",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["האצה", "מנטורינג"],
    },
    {
      id: "gt-anchor-customers",
      title: "לקוחות עוגן",
      provider: "גופי תעשייה ובטחון",
      category: "לקוחות",
      type: "customer",
      description: "מסגרות היכרות עם לקוחות עוגן פוטנציאליים בתעשיית החלל והבטחון, כבסיס להתקשרות מסחרית ראשונה.",
      stageFit: "מוצר קיים",
      sectorFit: "לפי תחום הלקוח",
      url: null,
      isDemo: true,
      tags: ["לקוחות", "מסחור"],
    },
    {
      id: "gt-investors-demo-day",
      title: "משקיעים / דמו דיי",
      provider: "קרנות הון סיכון ומאיצים",
      category: "השקעות",
      type: "investment",
      description: "אירועי הצגה בפני משקיעים ורשתות הון סיכון פעילות בתחום החלל, לרוב כחלק מתוכנית האצה או כנס ענפי.",
      stageFit: "Seed ואילך",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["השקעות", "דמו דיי"],
    },
    {
      id: "gt-market-entry",
      title: "יצוא / כניסה לשווקים",
      provider: "גופי סחר וסוכנויות",
      category: "כניסה לשווקים",
      type: "market",
      description: "תמיכה בכניסה ראשונית לשוק יעד — מידע רגולטורי, קשרי סחר ולעיתים ליווי משפטי/עסקי מקומי.",
      stageFit: "מוצר בשל ליצוא",
      sectorFit: "כל תחומי החלל",
      url: null,
      isDemo: true,
      tags: ["יצוא", "שווקים"],
    },
  ];

  function getGrowthTools() {
    return SEED.slice();
  }

  function getGrowthToolsByCategory(category) {
    return SEED.filter((item) => item.category === category);
  }

  function getCategories() {
    return Array.from(new Set(SEED.map((item) => item.category)));
  }

  window.GrowthToolsStore = {
    key: STORAGE_KEY,
    getGrowthTools,
    getGrowthToolsByCategory,
    getCategories,
  };
})();
