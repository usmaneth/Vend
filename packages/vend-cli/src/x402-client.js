import axios from 'axios';

export class X402Client {
  constructor() {
    this.axios = axios.create({
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });
  }

  async request(url, params = {}, paymentHash = null) {
    const headers = {};

    // Add payment hash if provided
    if (paymentHash) {
      headers['X-Payment-Hash'] = paymentHash;
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await this.axios.get(fullUrl, { headers });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  }
}
