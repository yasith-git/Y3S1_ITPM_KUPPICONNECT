// Base API client — handles auth headers, JSON parsing, error normalisation

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  try {
    const data = localStorage.getItem('kuppi_auth');
    return data ? JSON.parse(data).token : null;
  } catch {
    return null;
  }
}

async function request(method, path, body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.statusCode = res.status;
    throw error;
  }

  return data;
}

export const api = {
  get:    (path, auth = true)         => request('GET',    path, null, auth),
  post:   (path, body, auth = true)   => request('POST',   path, body, auth),
  put:    (path, body, auth = true)   => request('PUT',    path, body, auth),
  delete: (path, auth = true)         => request('DELETE', path, null, auth),
  // FormData variants — browser sets Content-Type + boundary automatically
  postForm: (path, formData) => requestForm('POST', path, formData),
  putForm:  (path, formData) => requestForm('PUT',  path, formData),
};

async function requestForm(method, path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData });
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.statusCode = res.status;
    throw error;
  }

  return data;
}
