const BASE_URL = 'https://api.finmindtrade.com/api/v4/data'

export default async function handler(req, res) {
  const { dataset, data_id, start_date, end_date } = req.query
  const token = process.env.FINMIND_TOKEN

  if (!dataset) {
    return res.status(400).json({ error: 'missing required params' })
  }

  const params = new URLSearchParams({ dataset })
  if (data_id) params.set('data_id', data_id)
  if (start_date) params.set('start_date', start_date)
  if (end_date) params.set('end_date', end_date)
  if (token) params.set('token', token)

  try {
    const response = await fetch(`${BASE_URL}?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('[finmind proxy error]', error)
    res.status(500).json({ error: 'upstream request failed' })
  }
}
