// 🔥 关键：允许运行 60 秒（解决超时）
export const maxDuration = 600;

export async function POST(request: Request) {
    console.log("收到去水印请求，正在处理...");
  try {
    // 1. 获取前端传过来的数据（base64 + 框选坐标）
    const body = await request.json();

     // 获取请求参数
    const { type } = body;

    let url = `${process.env.API_HOST}/remove-watermark`;

    if (type === "AI") {
      url = `${process.env.API_HOST}/remove-watermark-ai`;
    }
    console.log(url, "请求URL")

    // 2. 转发到你的本地 Python 后端 (8000端口)
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // 3. 转发也设置 60 秒超时
      signal: AbortSignal.timeout(600000),
    });

    // 4. 获取 Python 返回的修好的图片
    const data = await res.json();

    console.log("去水印处理完成，正在返回结果...", data);

    // 5. 返回给前端
    return Response.json(data);
  } catch (error) {
    console.error("API 错误：", error);
    return Response.json(
      { status: "error", message: "处理超时或服务器错误" },
      { status: 500 }
    );
  }
}