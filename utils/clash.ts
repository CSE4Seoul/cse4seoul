const BASE_URL = 'https://proxy.royaleapi.dev/v1';

export async function getClanInfo() {
  const clanTag = process.env.NEXT_PUBLIC_CLAN_TAG;
  const apiKey = process.env.CR_API_KEY;

  if (!clanTag || !apiKey) {
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/clans/${clanTag}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    return await res.json();

  } catch (error) {
    console.error("Failed to fetch clan info:", error);
    return null;
  }
}