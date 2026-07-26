/* ==========================================================
   storage.js — Cloudinary (images) + Firestore (metadata).
   Firebase Storage removed entirely (requires Blaze plan);
   images now go straight to Cloudinary's free unsigned upload.

   Firestore collection: "transactions" (structure unchanged)
     { year, month, day, time, dateStr, hh, mi, savedAt, hasCtv,
       khachUrl, banUrl, ctvUrl }
   khachUrl/banUrl/ctvUrl now hold Cloudinary secure_url values
   instead of Firebase Storage download URLs.
   ========================================================== */

const FbStorage = (() => {
  const db = firebase.firestore();
  const COLLECTION = 'transactions';

  function pad2(n) { return String(n).padStart(2, '0'); }

  /** Finds a free HH-MM (or HH-MM_n) time slot for this day, so nothing is ever overwritten. */
  async function findFreeTimeSlot(year, month, day, baseTime) {
    let timeName = baseTime;
    let suffix = 1;
    while (true) {
      const snap = await db.collection(COLLECTION)
        .where('year', '==', year).where('month', '==', month)
        .where('day', '==', day).where('time', '==', timeName)
        .limit(1).get();
      if (snap.empty) return timeName;
      suffix += 1;
      timeName = `${baseTime}_${suffix}`;
    }
  }

  async function saveTransaction(files, date = new Date()) {
    const yyyy = String(date.getFullYear());
    const mm = pad2(date.getMonth() + 1);
    const dd = pad2(date.getDate());
    const hh = pad2(date.getHours());
    const mi = pad2(date.getMinutes());
    const dateStr = `${dd}-${mm}-${yyyy}`;

    const timeName = await findFreeTimeSlot(yyyy, mm, dd, `${hh}-${mi}`);

    const khachUrl = await uploadToCloudinary(files.khach);
    const banUrl = await uploadToCloudinary(files.ban);
    const ctvUrl = files.ctv ? await uploadToCloudinary(files.ctv) : null;

    const record = {
      year: yyyy, month: mm, day: dd, time: timeName, dateStr, hh, mi,
      savedAt: Date.now(), hasCtv: !!files.ctv,
      khachUrl, banUrl, ctvUrl,
    };
    const docRef = await db.collection(COLLECTION).add(record);
    record.id = docRef.id;
    return record;
  }

  async function getAllTransactions() {
    const snap = await db.collection(COLLECTION).orderBy('savedAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return { saveTransaction, getAllTransactions };
})();
