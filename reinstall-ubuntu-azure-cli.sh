#!/bin/bash
# ============================================
# 🔄 REINSTALL UBUNTU ON AZURE VPS - COMMAND LINE ONLY
# ============================================

set -e

VM_NAME="today"
UBUNTU_IMAGE="Ubuntu2204"

echo "🔄 Azure VPS Ubuntu Reinstallation Script"
echo "=========================================="
echo ""

# Step 1: Install Azure CLI
echo "📦 Step 1: Checking Azure CLI..."
if ! command -v az &> /dev/null; then
    echo "   Installing Azure CLI..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    echo "   ✅ Azure CLI installed"
else
    echo "   ✅ Azure CLI already installed"
fi

# Step 2: Login to Azure
echo ""
echo "🔐 Step 2: Login to Azure..."
echo "   If browser doesn't open, you'll get a device code."
echo "   Enter it at: https://microsoft.com/devicelogin"
echo ""
az login

# Step 3: Get Resource Group
echo ""
echo "📋 Step 3: Finding your VM and resource group..."
RESOURCE_GROUP=$(az vm show --name "$VM_NAME" --query 'resourceGroup' -o tsv 2>/dev/null || echo "")

if [ -z "$RESOURCE_GROUP" ]; then
    echo "   ❌ Could not find VM '$VM_NAME'"
    echo ""
    echo "   Available VMs:"
    az vm list --output table
    echo ""
    read -p "   Enter your resource group name: " RESOURCE_GROUP
else
    echo "   ✅ Found resource group: $RESOURCE_GROUP"
fi

# Step 4: Get VM details
echo ""
echo "📝 Step 4: Getting VM details..."
VM_INFO=$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --output json)
LOCATION=$(echo "$VM_INFO" | jq -r '.location')
VM_SIZE=$(echo "$VM_INFO" | jq -r '.hardwareProfile.vmSize')
ADMIN_USER=$(echo "$VM_INFO" | jq -r '.osProfile.adminUsername')

echo "   Location: $LOCATION"
echo "   Size: $VM_SIZE"
echo "   Admin User: $ADMIN_USER"

# Step 5: Stop VM
echo ""
echo "🛑 Step 5: Stopping VM..."
az vm stop --resource-group "$RESOURCE_GROUP" --name "$VM_NAME"
echo "   Waiting for VM to stop..."
az vm wait --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --deleted false --custom "instanceView.statuses[?code=='PowerState/stopped']"
echo "   ✅ VM stopped"

# Step 6: Get OS disk name
echo ""
echo "💾 Step 6: Finding OS disk..."
OS_DISK_ID=$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --query 'storageProfile.osDisk.managedDisk.id' -o tsv)
OS_DISK_NAME=$(basename "$OS_DISK_ID")
echo "   OS Disk: $OS_DISK_NAME"

# Step 7: Delete VM (keeps disk by default)
echo ""
echo "🗑️  Step 7: Deleting VM (keeping disk)..."
az vm delete --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --yes
echo "   ✅ VM deleted"

# Step 8: Delete OS disk
echo ""
echo "🗑️  Step 8: Deleting OS disk..."
az disk delete --resource-group "$RESOURCE_GROUP" --name "$OS_DISK_NAME" --yes
echo "   ✅ OS disk deleted"

# Step 9: Create new VM with fresh Ubuntu
echo ""
echo "🆕 Step 9: Creating new VM with fresh Ubuntu..."
echo "   This will create a new VM with Ubuntu 22.04"
echo ""

# Generate SSH key if needed
SSH_KEY_PATH="$HOME/.ssh/id_rsa_azure_$VM_NAME"
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "   Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -q
fi

echo "   Creating VM (this may take a few minutes)..."
az vm create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --image "$UBUNTU_IMAGE" \
    --size "$VM_SIZE" \
    --location "$LOCATION" \
    --admin-username "$ADMIN_USER" \
    --ssh-key-values "$SSH_KEY_PATH.pub" \
    --public-ip-sku Standard \
    --output table

# Step 10: Get new IP
echo ""
echo "🌐 Step 10: Getting new VM IP address..."
NEW_IP=$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --show-details --query 'publicIps' -o tsv)
echo "   ✅ New VM IP: $NEW_IP"

echo ""
echo "=========================================="
echo "✅ Ubuntu Reinstallation Complete!"
echo ""
echo "📋 Summary:"
echo "   VM Name: $VM_NAME"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   New IP: $NEW_IP"
echo "   SSH Key: $SSH_KEY_PATH"
echo ""
echo "🔌 Connect with:"
echo "   ssh -i $SSH_KEY_PATH $ADMIN_USER@$NEW_IP"
echo ""

