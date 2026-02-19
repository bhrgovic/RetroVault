def get_token(client):
    client.post("/auth/register", json={
        "username": "gameuser",
        "email": "game@test.com",
        "password": "Test123!"
    })

    login = client.post("/auth/login", data={
        "username": "gameuser",
        "password": "Test123!"
    })

    return login.json()["access_token"]


def test_create_and_get_game(test_client):
    token = get_token(test_client)

    headers = {"Authorization": f"Bearer {token}"}

    create = test_client.post("/games/", json={
        "title": "Pokemon Red",
        "platform": "GameBoy",
        "year": 1996,
        "genre": "RPG"
    }, headers=headers)

    assert create.status_code == 200

    get = test_client.get("/games/", headers=headers)

    assert get.status_code == 200
    assert len(get.json()) >= 1
