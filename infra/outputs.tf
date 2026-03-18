output "droplet_ip" {
  description = "Public IP address of the Velox server"
  value       = digitalocean_droplet.velox.ipv4_address
}

output "droplet_name" {
  description = "Name of the Droplet"
  value       = digitalocean_droplet.velox.name
}
