terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# ── SSH Key ──
resource "digitalocean_ssh_key" "velox" {
  name       = "velox-deploy-key"
  public_key = file(var.ssh_public_key_path)
}

# ── Droplet ──
resource "digitalocean_droplet" "velox" {
  name     = "velox-server"
  image    = "ubuntu-24-04-x64"
  size     = "s-1vcpu-1gb-intel"
  region   = "blr1"
  ssh_keys = [digitalocean_ssh_key.velox.fingerprint]

  # Install Docker + set up 2GB swap on first boot
  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # ── 2GB Swap ──
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Lower swappiness so RAM is preferred, swap used only when needed
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    sysctl vm.swappiness=10

    # ── Install Docker ──
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # ── Enable Docker on boot ──
    systemctl enable docker
    systemctl start docker
  EOF
}
