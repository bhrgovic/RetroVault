from prometheus_client import Counter

users_registered = Counter(
    "retrovault_users_registered_total",
    "Accounts created through the registration endpoint",
)

logins = Counter(
    "retrovault_logins_total",
    "Login attempts, labelled by outcome",
    ["result"],
)

games_created = Counter(
    "retrovault_games_created_total",
    "Games added to a library",
)

games_deleted = Counter(
    "retrovault_games_deleted_total",
    "Games removed from a library",
)

uploads = Counter(
    "retrovault_uploads_total",
    "Files accepted by the upload endpoint, labelled by kind",
    ["kind"],
)

upload_rejections = Counter(
    "retrovault_upload_rejections_total",
    "Uploads refused by validation, labelled by reason",
    ["reason"],
)
