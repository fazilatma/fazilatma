// PM2 — اجرای پروداکشن
module.exports = {
  apps: [
    {
      name: "pricehunter",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      cwd: __dirname + "/..",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "700M",
      env: { NODE_ENV: "production", PORT: 3000 },
    },
  ],
};
