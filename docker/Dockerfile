################################################################################################
# Base stage
# - CUDA 12.8 Runtime + Python 3.10 on Ubuntu 22.04
################################################################################################
FROM pytorch/pytorch:2.7.0-cuda12.8-cudnn9-runtime AS base

LABEL org.opencontainers.image.title="Harbor Tracking App (CUDA 12.8 + Python 3.10)"
LABEL org.opencontainers.image.authors="yoseph.huang@gmail.com"
LABEL org.opencontainers.image.licenses="MIT"

ENV DEBIAN_FRONTEND=noninteractive

SHELL ["/bin/bash", "-c"]


################################################################################################
# user-setup stage
# - Creates a non-root user for improved security.
################################################################################################
FROM base AS user-setup

ARG USER_UID=1000
ARG USER_GID=1000
ARG USERNAME=appuser

## Create a non-root user
RUN groupadd --gid $USER_GID $USERNAME && \
    useradd --uid $USER_UID --gid $USER_GID -m $USERNAME -s /bin/bash && \
    apt-get update && \
    apt-get install -y sudo && \
    echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME && \
    chmod 0440 /etc/sudoers.d/$USERNAME && \
    rm -rf /var/lib/apt/lists/*


################################################################################################
# ultralytics stage
# - Installs the ultralytics yolov12 package and its dependencies.
################################################################################################
FROM user-setup AS ultralytics

# Install linux packages
RUN apt-get update && \
    apt-get install -y \
        git \
        wget \
        curl \
        htop \
        libpython3-dev \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home
RUN git clone https://github.com/sunsmarterjie/yolov12.git && \
    cd yolov12 && \
    wget https://github.com/Dao-AILab/flash-attention/releases/download/v2.7.3/flash_attn-2.7.3+cu11torch2.2cxx11abiFALSE-cp311-cp311-linux_x86_64.whl && \
    pip install -r requirements.txt && \
    pip install -e . && \
    pip install ultralytics -U && \
    cd /home && rm -rf yolov12



################################################################################################
# fastAPI stage
# - Sets up the environment for the backend of the Harbor Tracking App.
################################################################################################
FROM ultralytics AS fastapi

RUN pip install --no-cache-dir \
        fastapi \
        uvicorn[standard] \
        pillow



################################################################################################
# nextjs stage
# - Sets up the environment for the frontend of the Harbor Tracking App.
################################################################################################
FROM fastapi AS nextjs

RUN apt-get update && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && \
    apt-get install -y \
        nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm i -g \
        npm@11.4.1 \
        yarn


################################################################################################
# release stage
# - Final stage for the Harbor Tracking App, ready for deployment.
################################################################################################
FROM nextjs AS release

WORKDIR /home/yolov12-ws

USER appuser