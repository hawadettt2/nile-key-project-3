# Dockerfile لتشغيل GitHub Actions self-hosted runner داخل حاوية
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    curl jq git ca-certificates unzip sudo gnupg2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /actions-runner

# تنزيل نسخة runner (تحديث الإصدار عند الحاجة)
ARG RUNNER_VER=v2.334.0
RUN curl -L -o actions-runner.tar.gz "https://github.com/actions/runner/releases/download/${RUNNER_VER}/actions-runner-linux-x64-${RUNNER_VER}.tar.gz" \
    && tar xzf actions-runner.tar.gz \
    && rm actions-runner.tar.gz

# انسخ سكربت بدء التشغيل
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# متغيرات بيئة افتراضية (ستضبطها في Render)
ENV REPO_URL=""
ENV RUNNER_LABEL="nile-runner"
ENV GH_PAT=""
ENV RUNNER_USER="runner"

# مستخدم غير مميز لتشغيل الـ runner
RUN useradd -m -s /bin/bash ${RUNNER_USER} || true
RUN chown -R ${RUNNER_USER}:${RUNNER_USER} /actions-runner

USER ${RUNNER_USER}
ENTRYPOINT ["/entrypoint.sh"]
