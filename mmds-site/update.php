<?php
/* MMDS Auto-Update Handler
 * Updates site files directly from GitHub branch without manual file upload.
 */
declare(strict_types=1);

function mmds_http_get(string $url): ?string {
  // 1. Try cURL
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_CONNECTTIMEOUT => 8,
      CURLOPT_TIMEOUT => 25,
      CURLOPT_SSL_VERIFYPEER => false,
      CURLOPT_SSL_VERIFYHOST => 0,
      CURLOPT_USERAGENT => 'MMDS-AutoUpdater/1.0 (PHP; fazilatma/fazilatma)',
      CURLOPT_HTTPHEADER => ['Accept: application/vnd.github.v3+json, text/plain, */*'],
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if (is_string($body) && $code >= 200 && $code < 300) {
      return $body;
    }
  }

  // 2. Fallback to stream context / file_get_contents
  if (ini_get('allow_url_fopen')) {
    $ctx = stream_context_create([
      'http' => [
        'timeout' => 15,
        'user_agent' => 'MMDS-AutoUpdater/1.0 (PHP; fazilatma/fazilatma)',
        'header' => "Accept: application/vnd.github.v3+json, text/plain, */*\r\n",
        'follow_location' => 1,
      ],
      'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
      ],
    ]);
    $data = @file_get_contents($url, false, $ctx);
    if (is_string($data)) return $data;
  }

  return null;
}

function mmds_run_update(string $branch = 'arena/9a5c1fc9-fazilatma', bool $force = false): array {
  $repo = 'fazilatma/fazilatma';
  $cleanBranch = preg_replace('/[^a-zA-Z0-9_\-\.\/]/', '', $branch);
  if ($cleanBranch === '') $cleanBranch = 'arena/9a5c1fc9-fazilatma';

  $versionFile = __DIR__ . '/.mmds_version';
  $currentSha = file_exists($versionFile) ? trim((string)@file_get_contents($versionFile)) : '';

  // 1. Fetch latest commit SHA from GitHub API
  $apiUrl = "https://api.github.com/repos/{$repo}/commits/{$cleanBranch}";
  $commitJson = mmds_http_get($apiUrl);
  $remoteSha = '';
  $commitMsg = '';
  if ($commitJson !== null) {
    $parsed = json_decode($commitJson, true);
    if (is_array($parsed) && !empty($parsed['sha'])) {
      $remoteSha = (string)$parsed['sha'];
      $commitMsg = (string)($parsed['commit']['message'] ?? '');
    }
  }

  // If already at latest commit and not forced
  if ($remoteSha !== '' && !$force && $remoteSha === $currentSha) {
    return [
      'ok' => true,
      'updated' => false,
      'current_sha' => substr($currentSha, 0, 7),
      'message' => 'سایت در حال حاضر به‌روز است (کامیت: ' . substr($currentSha, 0, 7) . ').',
    ];
  }

  // 2. Download raw files
  $files = [
    'index.php'   => "https://raw.githubusercontent.com/{$repo}/{$cleanBranch}/mmds-site/index.php",
    'auth.php'    => "https://raw.githubusercontent.com/{$repo}/{$cleanBranch}/mmds-site/auth.php",
    'update.php'  => "https://raw.githubusercontent.com/{$repo}/{$cleanBranch}/mmds-site/update.php",
    'schema.sql'  => "https://raw.githubusercontent.com/{$repo}/{$cleanBranch}/mmds-site/schema.sql",
  ];

  $downloaded = [];
  foreach ($files as $localName => $remoteUrl) {
    $urlWithTs = $remoteUrl . '?_ts=' . time();
    $content = mmds_http_get($urlWithTs);
    if ($content === null || strlen($content) < 30) {
      if ($localName === 'index.php') {
        return [
          'ok' => false,
          'message' => "خطا در دریافت فایل {$localName} از مخزن گیت‌هاب.",
        ];
      }
      continue;
    }

    // Basic validity check for PHP files
    if (str_ends_with($localName, '.php') && !str_contains($content, '<?php')) {
      return [
        'ok' => false,
        'message' => "محتوای فایل {$localName} نامعتبر است.",
      ];
    }

    $downloaded[$localName] = $content;
  }

  // 3. Atomically replace files
  $written = [];
  foreach ($downloaded as $localName => $content) {
    $targetPath = __DIR__ . '/' . $localName;
    $tmpPath = $targetPath . '.tmp.' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmpPath, $content) === false) {
      @unlink($tmpPath);
      return [
        'ok' => false,
        'message' => "دسترسی نوشتن روی فایل {$localName} وجود ندارد. سطح دسترسی پوشه هاست را بررسی فرمایید.",
      ];
    }
    if (!@rename($tmpPath, $targetPath)) {
      @unlink($tmpPath);
      return [
        'ok' => false,
        'message' => "خطا در جایگزینی فایل {$localName}.",
      ];
    }
    $written[] = $localName;
  }

  // 4. Save new SHA
  $savedSha = $remoteSha !== '' ? $remoteSha : ('manual_' . time());
  @file_put_contents($versionFile, $savedSha);

  // 5. Invalidate PHP OPcache
  if (function_exists('opcache_reset')) {
    @opcache_reset();
  }

  return [
    'ok' => true,
    'updated' => true,
    'sha' => substr($savedSha, 0, 7),
    'branch' => $cleanBranch,
    'files' => $written,
    'commit_message' => trim((string)strtok($commitMsg, "\n")),
    'message' => 'سایت با موفقیت به کامیت ' . substr($savedSha, 0, 7) . ' از برنچ ' . $cleanBranch . ' به‌روز شد.',
  ];
}

function mmds_maybe_background_check(): void {
  $checkFile = __DIR__ . '/.last_update_check';
  $now = time();
  if (file_exists($checkFile)) {
    $lastCheck = (int)@file_get_contents($checkFile);
    // Check at most once every 180 seconds (3 minutes) to keep page loads fast
    if ($now - $lastCheck < 180) return;
  }
  @file_put_contents($checkFile, (string)$now);

  try {
    $branch = getenv('MMDS_UPDATE_BRANCH') ?: 'arena/9a5c1fc9-fazilatma';
    mmds_run_update($branch, false);
  } catch (Throwable $e) {
    // Quiet fail on background check so user experience is not affected
  }
}

function mmds_handle_update_request(): void {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');

  $defaultToken = 'mmds_auto_update_token';
  $expectedToken = getenv('MMDS_UPDATE_TOKEN') ?: $defaultToken;

  $token = (string)($_GET['token'] ?? $_POST['token'] ?? $_SERVER['HTTP_X_UPDATE_TOKEN'] ?? '');
  $force = !empty($_GET['force']) || !empty($_POST['force']);
  $branch = (string)($_GET['branch'] ?? $_POST['branch'] ?? getenv('MMDS_UPDATE_BRANCH') ?: 'arena/9a5c1fc9-fazilatma');

  // Allowed if token matches, or same-origin request from website UI
  $referer = (string)($_SERVER['HTTP_REFERER'] ?? '');
  $host = (string)($_SERVER['HTTP_HOST'] ?? '');
  $isSameOrigin = ($referer !== '' && $host !== '' && str_contains($referer, $host));
  $isTokenValid = ($token !== '' && hash_equals($expectedToken, $token));

  if (!$isTokenValid && !$isSameOrigin) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'توکن امنیتی برای بروزرسانی نامعتبر است.'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $res = mmds_run_update($branch, $force);
  http_response_code($res['ok'] ? 200 : 500);
  echo json_encode($res, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if ((isset($_GET['mmds']) && $_GET['mmds'] === 'update') || basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'update.php') {
  mmds_handle_update_request();
}
