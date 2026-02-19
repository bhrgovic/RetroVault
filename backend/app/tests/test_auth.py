def test_register_and_login(test_client):
    response = test_client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@test.com",
        "password": "Test123!"
    })
    assert response.status_code == 200

    login = test_client.post("/auth/login", data={
        "username": "testuser",
        "password": "Test123!"
    })

    assert login.status_code == 200
    assert "access_token" in login.json()
