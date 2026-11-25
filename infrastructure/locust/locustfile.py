from locust import HttpUser, task, between


class SkepticalControlUser(HttpUser):
    wait_time = between(0.5, 2.0)

    @task(5)
    def health(self):
        self.client.get("/health", name="GET /health")

    @task(2)
    def root(self):
        self.client.get("/", name="GET /")
