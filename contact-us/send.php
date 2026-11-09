<?php
/**
 * Contact form handler — Scopus Research Publishers
 *
 * Works on any standard PHP host (e.g. Hostinger shared hosting) using PHP's mail().
 * The page posts here with fetch() and expects JSON; without JavaScript the
 * browser posts normally and is redirected back to the contact page.
 *
 * Configure the two addresses below. FROM_ADDRESS should be a mailbox on this
 * domain so the message passes SPF/DKIM and doesn't land in spam.
 */

const TO_ADDRESS   = 'info@scopusresearchpublishers.com';
const FROM_ADDRESS = 'no-reply@scopusresearchpublishers.com';
const SITE_NAME    = 'Scopus Research Publishers';

header('X-Content-Type-Options: nosniff');

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond(bool $ok, string $error = '', int $status = 200): void {
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error]);
    } else {
        header('Location: ./?' . ($ok ? 'sent=1' : 'error=1') . '#main', true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Invalid request.', 405);
}

// Honeypot: real visitors never fill this hidden field.
if (!empty($_POST['website'])) {
    respond(true);
}

// Basic per-session rate limit: one message every 30 seconds.
session_start();
if (!empty($_SESSION['last_contact']) && time() - $_SESSION['last_contact'] < 30) {
    respond(false, 'Please wait a moment before sending another message.', 429);
}

function field(string $key, int $max): string {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    return mb_substr($v, 0, $max);
}
function oneLine(string $v): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $v)); // blocks header injection
}

$first   = oneLine(field('first_name', 80));
$last    = oneLine(field('last_name', 80));
$email   = oneLine(field('email', 160));
$phone   = oneLine(field('phone', 40));
$service = oneLine(field('service', 120));
$message = field('message', 5000);

if ($first === '' || $last === '' || $message === '') {
    respond(false, 'Please complete your name and message.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', 422);
}

$name    = "$first $last";
$subject = 'New enquiry from ' . $name . ($service ? " — $service" : '');
$body    = "New enquiry from the website contact form\n"
         . "------------------------------------------\n\n"
         . "Name:    $name\n"
         . "Email:   $email\n"
         . "Phone:   " . ($phone ?: '—') . "\n"
         . "Service: " . ($service ?: 'Not sure yet') . "\n\n"
         . "Message:\n$message\n\n"
         . "------------------------------------------\n"
         . 'Sent ' . gmdate('j M Y, H:i') . " UTC from " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown IP') . "\n";

$headers = [
    'From: ' . SITE_NAME . ' <' . FROM_ADDRESS . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail(TO_ADDRESS, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . FROM_ADDRESS);

if (!$sent) {
    respond(false, 'Sorry, the message could not be sent. Please email ' . TO_ADDRESS . ' or message us on WhatsApp.', 500);
}

$_SESSION['last_contact'] = time();
respond(true);
