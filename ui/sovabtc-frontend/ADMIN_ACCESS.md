# SovaBTC Admin Panel Access

## Security Notice

The admin panel has been secured with a secret URL path to prevent unauthorized access attempts.

## Admin Access

**Secret Admin URL**: `/admin-x7k9j2n8`

### Access Requirements:
1. **Wallet Connection**: Must connect a wallet
2. **Owner Verification**: Connected wallet must be the protocol owner
3. **Secret URL**: Must navigate to the secret admin path

### Navigation:
- **For Protocol Owners**: The admin link will automatically appear in the navigation bar when connected as owner
- **Direct Access**: Navigate to `https://your-domain.com/admin-x7k9j2n8`
- **Decoy Page**: The public `/admin` path shows an access denied message

### Security Features:
- **Multi-layer protection**: Secret URL + Owner verification + Wallet connection
- **Automatic redirection**: Non-owners are redirected to the home page
- **Decoy endpoint**: Public admin path misleads potential attackers
- **Visual indicators**: Admin navigation items are highlighted in red

### Admin Panel Features:
- Token whitelist management
- Custody address configuration
- Emergency pause/unpause controls
- Redemption queue management
- Protocol statistics and monitoring

---

**⚠️ KEEP THIS PATH SECURE**: Do not share the secret admin URL publicly. Only distribute to authorized protocol administrators. 