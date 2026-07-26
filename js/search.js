/* ==========================================================
   search.js — parses the free-text search box and filters the
   in-memory transaction index. Supported patterns (as specified):
     2026            -> year
     07              -> month
     07/2026         -> month/year
     26/07           -> day/month
     26/07/2026      -> day/month/year
   ========================================================== */

const Search = (() => {
  function parseQuery(raw) {
    const q = raw.trim();
    if (!q) return null;

    let m;
    if ((m = q.match(/^(\d{4})$/))) {
      return { year: m[1] };
    }
    if ((m = q.match(/^(\d{2})$/))) {
      return { month: m[1] };
    }
    if ((m = q.match(/^(\d{2})\/(\d{4})$/))) {
      return { month: m[1], year: m[2] };
    }
    if ((m = q.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
      return { day: m[1], month: m[2], year: m[3] };
    }
    if ((m = q.match(/^(\d{2})\/(\d{2})$/))) {
      return { day: m[1], month: m[2] };
    }
    return { invalid: true };
  }

  function filter(records, raw) {
    const criteria = parseQuery(raw);
    if (!criteria) return records;
    if (criteria.invalid) return [];
    return records.filter((r) => {
      if (criteria.year && r.year !== criteria.year) return false;
      if (criteria.month && r.month !== criteria.month) return false;
      if (criteria.day && r.day !== criteria.day) return false;
      return true;
    });
  }

  return { parseQuery, filter };
})();
