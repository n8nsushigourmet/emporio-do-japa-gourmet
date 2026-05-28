<?php
require_once __DIR__ . '/includes/auth.php';
logoutAdmin();
header('Location: /emporio/');
exit;
