export async function getPostBySlugOrIdREST(identifier: string) {
  const projectId = 'affable-framing-447209-s8';
  const databaseId = 'ai-studio-40c393d7-119e-4843-aa4a-5845e5f3b74a';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  try {
    const queryUrl = `${baseUrl}:runQuery`;
    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'posts' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: identifier }
            }
          },
          limit: 1
        }
      }),
      next: { revalidate: 300 } 
    });

    if (queryRes.ok) {
      const results = await queryRes.json();
      if (results && results.length > 0 && results[0].document) {
        return parseFirestoreDocument(results[0].document);
      }
    }

    const docRes = await fetch(`${baseUrl}/posts/${identifier}`, { next: { revalidate: 300 } });
    if (docRes.ok) {
      const data = await docRes.json();
      return parseFirestoreDocument(data);
    }
  } catch (error) {
    console.error('Error fetching post via REST:', error);
  }
  return null;
}

export async function getAllPostsREST() {
  const projectId = 'affable-framing-447209-s8';
  const databaseId = 'ai-studio-40c393d7-119e-4843-aa4a-5845e5f3b74a';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/posts`;

  try {
    const docRes = await fetch(baseUrl, { cache: 'no-store' });
    if (docRes.ok) {
      const data = await docRes.json();
      if (!data.documents) return [];
      return data.documents.map(parseFirestoreDocument).filter(Boolean);
    }
  } catch (error) {
    console.error('Error fetching all posts via REST:', error);
  }
  return [];
}

export async function getSettingsREST() {
  const projectId = 'affable-framing-447209-s8';
  const databaseId = 'ai-studio-40c393d7-119e-4843-aa4a-5845e5f3b74a';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  try {
    const docRes = await fetch(`${baseUrl}/settings/global`, { cache: 'no-store' });
    if (docRes.ok) {
      const data = await docRes.json();
      return parseFirestoreDocument(data);
    }
  } catch (error) {
    console.error('Error fetching settings via REST:', error);
  }
  return null;
}

export async function getSectionBySlugREST(identifier: string) {
  const projectId = 'affable-framing-447209-s8';
  const databaseId = 'ai-studio-40c393d7-119e-4843-aa4a-5845e5f3b74a';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  try {
    const queryUrl = `${baseUrl}:runQuery`;
    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'sections' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: identifier }
            }
          },
          limit: 1
        }
      }),
      cache: 'no-store'
    });

    if (queryRes.ok) {
      const results = await queryRes.json();
      if (results && results.length > 0 && results[0].document) {
        return parseFirestoreDocument(results[0].document);
      }
    }
  } catch (error) {
    console.error('Error fetching section via REST:', error);
  }
  return null;
}

export async function getSeoPageBySlugREST(identifier: string) {
  const projectId = 'affable-framing-447209-s8';
  const databaseId = 'ai-studio-40c393d7-119e-4843-aa4a-5845e5f3b74a';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  try {
    const queryUrl = `${baseUrl}:runQuery`;
    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'seoPages' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: identifier }
            }
          },
          limit: 1
        }
      }),
      cache: 'no-store'
    });

    if (queryRes.ok) {
      const results = await queryRes.json();
      if (results && results.length > 0 && results[0].document) {
        return parseFirestoreDocument(results[0].document);
      }
    }
  } catch (error) {
    console.error('Error fetching seoPage via REST:', error);
  }
  return null;
}

export async function getAllSeoPagesREST() {
  const projectId = 'affable-framing-447209-s8';
  const databaseId = 'ai-studio-40c393d7-119e-4843-aa4a-5845e5f3b74a';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/seoPages`;

  try {
    const docRes = await fetch(baseUrl, { cache: 'no-store' });
    if (docRes.ok) {
      const data = await docRes.json();
      if (!data.documents) return [];
      return data.documents.map(parseFirestoreDocument).filter(Boolean);
    }
  } catch (error) {
    console.error('Error fetching all seoPages via REST:', error);
  }
  return [];
}

function parseFirestoreDocument(doc: any) {
  if (!doc || !doc.fields) return null;
  const data: any = { id: doc.name.split('/').pop() };
  for (const [key, value] of Object.entries(doc.fields)) {
    data[key] = extractValue((value as any));
  }
  return data;
}

function extractValue(val: any): any {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(extractValue);
  if ('mapValue' in val) {
    const obj: any = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) { obj[k] = extractValue(v); }
    return obj;
  }
  return val;
}
