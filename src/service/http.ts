"use client";

import { getPrefixUrl } from "@/utils";

export interface HttpResponse<T> {
  code: number;
  message: string;
  data: T;
}

class WaterHttp {
  prefixUrl: string;

  constructor() {
    this.prefixUrl = getPrefixUrl();
  }

  post<T>(
    url: string,
    data: Record<string, unknown>,
  ): Promise<HttpResponse<T>> {
    return fetch(this.prefixUrl + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => res.json());
  }
}

export const http = new WaterHttp();
