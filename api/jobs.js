export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = 'https://yaowectkpqumdqkuypn.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ success: false, error: 'Не задан SUPABASE_SERVICE_ROLE_KEY в настройках Vercel' });
  }

  try {
    // GET: Получение вакансий через сервер Vercel
    if (req.method === 'GET') {
      const { category } = req.query || {};
      let url = `${SUPABASE_URL}/rest/v1/jobs?status=eq.active&order=created_at.desc`;
      if (category) {
        url += `&category=eq.${encodeURIComponent(category)}`;
      }

      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error('Ошибка Supabase GET: ' + errText);
      }

      const data = await response.json();
      return res.status(200).json({ success: true, data: data || [] });
    }

    // POST: Создание вакансии через сервер Vercel
    if (req.method === 'POST') {
      const { user, job } = req.body || {};

      if (!user || !job) {
        return res.status(400).json({ success: false, error: 'Не переданы данные пользователя или вакансии' });
      }

      // Сохранение пользователя
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id: user.id, first_name: user.first_name })
      });

      // Создание вакансии
      const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          employer_id: user.id,
          category: job.category,
          workers_count: job.workers_count,
          description: job.description,
          work_date_time: job.work_date_time,
          salary: job.salary,
          location: job.location,
          status: 'active'
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error('Ошибка создания вакансии: ' + errText);
      }

      const data = await response.json();
      return res.status(200).json({ success: true, data: data[0], message: 'Вакансия успешно опубликована!' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
