<?php
/* MMDS registration and login API. Configure all secrets as server environment variables. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function auth_reply(int $status, array $payload): never {
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function envv(string $key, string $default = ''): string {
  $v = getenv($key);
  return $v === false ? $default : trim($v);
}
function auth_db(): PDO {
  $dsn = envv('MMDS_DB_DSN');
  if ($dsn === '') auth_reply(503, ['ok'=>false,'message'=>'تنظیم اتصال پایگاه‌داده روی هاست انجام نشده است.']);
  try {
    return new PDO($dsn, envv('MMDS_DB_USER'), envv('MMDS_DB_PASSWORD'), [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  } catch (Throwable $e) {
    error_log('MMDS database connection failed: '.$e->getMessage());
    auth_reply(503, ['ok'=>false,'message'=>'اتصال پایگاه‌داده برقرار نشد؛ تنظیمات هاست را بررسی کنید.']);
  }
}
function auth_csrf(): void {
  $token = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
  if (empty($_SESSION['csrf']) || !hash_equals((string)$_SESSION['csrf'], $token))
    auth_reply(403, ['ok'=>false,'message'=>'درخواست منقضی شده است؛ صفحه را تازه‌سازی کنید.']);
}
function otp_hash(string $code): string {
  $pepper = envv('MMDS_OTP_PEPPER');
  if (strlen($pepper) < 32) auth_reply(503, ['ok'=>false,'message'=>'تنظیم امن کدهای تأیید روی هاست کامل نیست.']);
  return hash_hmac('sha256', $code, $pepper);
}
function payamak_send(string $to, string $text): void {
  if (!function_exists('curl_init')) auth_reply(503, ['ok'=>false,'message'=>'افزونه cURL در PHP هاست فعال نیست.']);
  $user = envv('MMDS_MELIPAYAMAK_USERNAME');
  $pass = envv('MMDS_MELIPAYAMAK_PASSWORD');
  $from = envv('MMDS_MELIPAYAMAK_FROM');
  if ($user === '' || $pass === '' || $from === '') auth_reply(503, ['ok'=>false,'message'=>'تنظیمات سرویس پیامک روی هاست کامل نیست.']);
  $url = envv('MMDS_MELIPAYAMAK_URL', 'https://rest.payamak-panel.com/api/SendSMS/SendSMS');
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json; charset=utf-8'],
    CURLOPT_POSTFIELDS => json_encode(['username'=>$user,'password'=>$pass,'to'=>$to,'from'=>$from,'text'=>$text,'isFlash'=>false]),
  ]);
  $body = curl_exec($ch); $err = curl_error($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
  $data = is_string($body) ? json_decode($body, true) : null;
  if ($err || $code < 200 || $code >= 300 || !is_array($data) || (isset($data['Value']) && (int)$data['Value'] < 0)) {
    error_log('MMDS SMS send failed: '.$err.' HTTP '.$code.' body '.substr((string)$body, 0, 300));
    auth_reply(502, ['ok'=>false,'message'=>'ارسال پیامک ناموفق بود؛ تنظیمات پنل پیامک را بررسی کنید.']);
  }
}
function smtp_read($fp): string {
  $response = '';
  while (($line = fgets($fp, 515)) !== false) {
    $response .= $line;
    if (strlen($line) >= 4 && $line[3] === ' ') break;
  }
  return $response;
}
function smtp_expect($fp, array $codes): string {
  $r = smtp_read($fp);
  $code = (int)substr($r, 0, 3);
  if (!in_array($code, $codes, true)) throw new RuntimeException('SMTP rejected command: '.substr(trim($r),0,200));
  return $r;
}
function smtp_cmd($fp, string $cmd, array $codes): string {
  if (fwrite($fp, $cmd."\r\n") === false) throw new RuntimeException('SMTP write failed');
  return smtp_expect($fp, $codes);
}
function gmail_send(string $to, string $subject, string $body): void {
  $user = envv('MMDS_GMAIL_USER'); $pass = envv('MMDS_GMAIL_APP_PASSWORD');
  if ($user === '' || $pass === '') auth_reply(503, ['ok'=>false,'message'=>'تنظیم Gmail SMTP روی هاست کامل نیست.']);
  $fromName = envv('MMDS_MAIL_FROM_NAME', 'MMDS');
  $fp = @stream_socket_client('tcp://smtp.gmail.com:587', $errno, $errstr, 20, STREAM_CLIENT_CONNECT);
  if (!$fp) { error_log('MMDS SMTP connect failed: '.$errstr); auth_reply(502,['ok'=>false,'message'=>'اتصال به سرویس ایمیل برقرار نشد.']); }
  stream_set_timeout($fp, 20);
  try {
    smtp_expect($fp, [220]);
    $helo = preg_replace('/[^A-Za-z0-9.-]/', '', (string)(gethostname() ?: 'localhost')) ?: 'localhost';
    smtp_cmd($fp, 'EHLO '.$helo, [250]);
    smtp_cmd($fp, 'STARTTLS', [220]);
    if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new RuntimeException('SMTP TLS negotiation failed');
    smtp_cmd($fp, 'EHLO '.$helo, [250]);
    smtp_cmd($fp, 'AUTH LOGIN', [334]);
    smtp_cmd($fp, base64_encode($user), [334]);
    smtp_cmd($fp, base64_encode($pass), [235]);
    smtp_cmd($fp, 'MAIL FROM:<'.$user.'>', [250]);
    smtp_cmd($fp, 'RCPT TO:<'.$to.'>', [250, 251]);
    smtp_cmd($fp, 'DATA', [354]);
    $encodedSubject = '=?UTF-8?B?'.base64_encode($subject).'?=';
    $safeName = '=?UTF-8?B?'.base64_encode($fromName).'?=';
    $msg = 'From: '.$safeName.' <'.$user."\r\n".
      'To: <'.$to."\r\n".
      'Subject: '.$encodedSubject."\r\n".
      "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n".
      chunk_split(base64_encode($body), 76, "\r\n");
    $msg = preg_replace('/(^|\r\n)\./', '$1..', $msg);
    fwrite($fp, $msg."\r\n.\r\n"); smtp_expect($fp, [250]);
    smtp_cmd($fp, 'QUIT', [221]);
  } catch (Throwable $e) {
    error_log('MMDS email send failed: '.$e->getMessage());
    fclose($fp);
    auth_reply(502, ['ok'=>false,'message'=>'ارسال ایمیل تأیید ناموفق بود؛ تنظیمات Gmail SMTP را بررسی کنید.']);
  }
  fclose($fp);
}

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$isHttps,'httponly'=>true,'samesite'=>'Lax']);
session_start();
$action = (string)($_GET['action'] ?? '');
if ($action === 'csrf') {
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
  auth_reply(200, ['ok'=>true,'csrf'=>$_SESSION['csrf'],'user'=>isset($_SESSION['mmds_user']) ? ['name'=>$_SESSION['mmds_user']] : null]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') auth_reply(405,['ok'=>false,'message'=>'روش درخواست پشتیبانی نمی‌شود.']);
$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) auth_reply(400,['ok'=>false,'message'=>'درخواست نامعتبر است.']);
auth_csrf();
$action = (string)($input['action'] ?? '');

if ($action === 'logout') {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) { $p=session_get_cookie_params(); setcookie(session_name(),'',time()-42000,$p['path'],$p['domain'] ?? '',$p['secure'],$p['httponly']); }
  session_destroy(); auth_reply(200,['ok'=>true,'message'=>'خارج شدید.']);
}
$db = auth_db();
if ($action === 'request_signup') {
  $name = trim((string)($input['name'] ?? ''));
  $email = strtolower(trim((string)($input['email'] ?? '')));
  $phone = preg_replace('/[\s()\-]/u', '', (string)($input['phone'] ?? ''));
  $password = (string)($input['password'] ?? '');
  if (strlen($name) < 2 || strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190 || !preg_match('/^09\d{9}$/', $phone) || strlen($password) < 10 || strlen($password) > 200)
    auth_reply(422,['ok'=>false,'message'=>'نام، ایمیل، موبایل ایرانی و گذرواژه حداقل ۱۰ حرفی را درست وارد کنید.']);
  $check=$db->prepare('SELECT id FROM mmds_users WHERE email=? OR phone=? LIMIT 1'); $check->execute([$email,$phone]);
  if ($check->fetch()) auth_reply(409,['ok'=>false,'message'=>'این ایمیل یا شماره موبایل قبلاً ثبت شده است.']);
  $find=$db->prepare('SELECT id,last_sent_at FROM mmds_pending_users WHERE email=? OR phone=? LIMIT 1'); $find->execute([$email,$phone]); $pending=$find->fetch();
  if ($pending && strtotime((string)$pending['last_sent_at']) > time()-60) auth_reply(429,['ok'=>false,'message'=>'برای ارسال دوباره کد، یک دقیقه صبر کنید.']);
  $emailCode=(string)random_int(100000,999999); $phoneCode=(string)random_int(100000,999999);
  $hashEmail=otp_hash($emailCode); $hashPhone=otp_hash($phoneCode); $passwordHash=password_hash($password,PASSWORD_DEFAULT);
  $expires=date('Y-m-d H:i:s',time()+600); $now=date('Y-m-d H:i:s');
  if ($pending) {
    $q=$db->prepare('UPDATE mmds_pending_users SET name=?,email=?,phone=?,password_hash=?,email_code_hash=?,phone_code_hash=?,expires_at=?,last_sent_at=?,attempts=0 WHERE id=?');
    $q->execute([$name,$email,$phone,$passwordHash,$hashEmail,$hashPhone,$expires,$now,$pending['id']]);
  } else {
    $q=$db->prepare('INSERT INTO mmds_pending_users (name,email,phone,password_hash,email_code_hash,phone_code_hash,expires_at,last_sent_at,attempts) VALUES (?,?,?,?,?,?,?,?,0)');
    $q->execute([$name,$email,$phone,$passwordHash,$hashEmail,$hashPhone,$expires,$now]);
  }
  payamak_send($phone, 'کد تأیید موبایل MMDS: '.$phoneCode.' — اعتبار ۱۰ دقیقه');
  gmail_send($email, 'کد تأیید ثبت‌نام MMDS', 'کد تأیید ایمیل شما: '.$emailCode."\nاعتبار کد: ۱۰ دقیقه. اگر این درخواست از طرف شما نیست، این پیام را نادیده بگیرید.");
  auth_reply(200,['ok'=>true,'message'=>'دو کد جداگانه به موبایل و ایمیل شما ارسال شد؛ هر دو را وارد کنید.']);
}
if ($action === 'verify_signup') {
  $email=strtolower(trim((string)($input['email'] ?? ''))); $phone=preg_replace('/[\s()\-]/u','',(string)($input['phone'] ?? ''));
  $ec=(string)($input['email_code'] ?? ''); $pc=(string)($input['phone_code'] ?? '');
  if (!filter_var($email,FILTER_VALIDATE_EMAIL) || !preg_match('/^09\d{9}$/',$phone) || !preg_match('/^\d{6}$/',$ec) || !preg_match('/^\d{6}$/',$pc)) auth_reply(422,['ok'=>false,'message'=>'ایمیل، موبایل و هر دو کد ۶ رقمی را وارد کنید.']);
  $q=$db->prepare('SELECT * FROM mmds_pending_users WHERE email=? AND phone=? LIMIT 1'); $q->execute([$email,$phone]); $p=$q->fetch();
  if (!$p || strtotime((string)$p['expires_at']) < time()) auth_reply(410,['ok'=>false,'message'=>'کدها منقضی شده‌اند؛ دوباره درخواست کد کنید.']);
  if ((int)$p['attempts'] >= 5) auth_reply(429,['ok'=>false,'message'=>'تعداد تلاش‌ها بیش از حد شد؛ کد جدید درخواست کنید.']);
  if (!hash_equals((string)$p['email_code_hash'],otp_hash($ec)) || !hash_equals((string)$p['phone_code_hash'],otp_hash($pc))) {
    $db->prepare('UPDATE mmds_pending_users SET attempts=attempts+1 WHERE id=?')->execute([$p['id']]);
    auth_reply(422,['ok'=>false,'message'=>'یکی از کدها نادرست است.']);
  }
  try {
    $q=$db->prepare('INSERT INTO mmds_users (name,email,phone,password_hash,email_verified_at,phone_verified_at,created_at) VALUES (?,?,?,?,NOW(),NOW(),NOW())');
    $q->execute([$p['name'],$p['email'],$p['phone'],$p['password_hash']]); $uid=(int)$db->lastInsertId();
  } catch (PDOException $e) {
    if ((string)$e->getCode()==='23000') auth_reply(409,['ok'=>false,'message'=>'این ایمیل یا موبایل از قبل ثبت شده است.']);
    throw $e;
  }
  $db->prepare('DELETE FROM mmds_pending_users WHERE id=?')->execute([$p['id']]);
  session_regenerate_id(true); $_SESSION['mmds_user']=$p['name']; $_SESSION['mmds_uid']=$uid;
  auth_reply(200,['ok'=>true,'message'=>'ثبت‌نام و تأیید هر دو راه ارتباطی انجام شد.']);
}
if ($action === 'login') {
  $identity=trim((string)($input['identity'] ?? '')); $password=(string)($input['password'] ?? '');
  if ($identity==='' || $password==='') auth_reply(422,['ok'=>false,'message'=>'ایمیل یا موبایل و گذرواژه را وارد کنید.']);
  $q=$db->prepare('SELECT id,name,password_hash FROM mmds_users WHERE email=? OR phone=? LIMIT 1'); $q->execute([strtolower($identity),$identity]); $u=$q->fetch();
  if (!$u || !password_verify($password,(string)$u['password_hash'])) auth_reply(401,['ok'=>false,'message'=>'اطلاعات ورود نادرست است.']);
  session_regenerate_id(true); $_SESSION['mmds_user']=$u['name']; $_SESSION['mmds_uid']=(int)$u['id'];
  auth_reply(200,['ok'=>true,'message'=>'وارد شدید.']);
}
auth_reply(400,['ok'=>false,'message'=>'درخواست نامعتبر است.']);
