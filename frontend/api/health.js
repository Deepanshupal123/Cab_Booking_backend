export default function handler(_req, res) {
  res.status(200).json({
    success: false,
    message:
      "This is the Vercel frontend, not the API. Open your Render URL: https://YOUR-SERVICE.onrender.com/health",
  });
}
