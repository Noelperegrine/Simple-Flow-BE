# Practice Flow Data Import Guide

This directory contains example data files and templates for bulk importing data into Practice Flow.

## 📁 Directory Structure

```
data/
├── customers.json          # Customer data in JSON format
├── customers.csv           # Customer data in CSV format
├── users.csv               # User data in CSV format
├── activity-logs.json      # Activity logs in JSON format
├── templates/              # Data templates and examples
└── README.md              # This file
```

## 📊 Data Format Requirements

### Customers (customers.json/csv)

Required fields:
- `name`: String - Practice/organization name
- `email`: String - Contact email (must be unique)

Optional fields:
- `status`: String - 'active', 'at_risk', or 'churned' (default: 'active')
- `health_score`: Number - 0-100 (default: 0)
- `mrr`: Number - Monthly recurring revenue (default: 0)
- `plan`: String - Subscription plan (default: 'Starter')
- `churn_date`: Date string - Only if status is 'churned'
- `scheduling_appointments`: Number
- `telehealth_sessions`: Number
- `notes_created`: Number
- `billing_transactions`: Number
- `insurance_claims`: Number
- `client_portal_logins`: Number
- `measurement_assessments`: Number
- `treatment_plans`: Number

### Users (users.json/csv)

Required fields:
- `email`: String - User email (must be unique)
- `full_name`: String - User's full name

Optional fields:
- `role`: String - 'admin' or 'user' (default: 'user')

### Activity Logs (activity-logs.json/csv)

Required fields:
- `user_id`: String - User identifier
- `page_name`: String - Page/section name

Optional fields:
- `timestamp`: Date string (default: current time)
- `ip_address`: String
- `user_agent`: String

## 📝 Example Data Formats

### JSON Format (customers.json)
```json
[
  {
    "name": "Wellness Medical Center",
    "email": "contact@wellnessmc.com",
    "status": "active",
    "health_score": 85,
    "mrr": 299,
    "plan": "Plus",
    "scheduling_appointments": 145,
    "telehealth_sessions": 32,
    "notes_created": 89,
    "billing_transactions": 156,
    "insurance_claims": 45,
    "client_portal_logins": 234,
    "measurement_assessments": 12,
    "treatment_plans": 23
  }
]
```

### CSV Format (customers.csv)
```csv
name,email,status,health_score,mrr,plan,scheduling_appointments,telehealth_sessions,notes_created,billing_transactions,insurance_claims,client_portal_logins,measurement_assessments,treatment_plans
Wellness Medical Center,contact@wellnessmc.com,active,85,299,Plus,145,32,89,156,45,234,12,23
Downtown Clinic,info@downtownclinic.com,at_risk,65,199,Essential,89,12,45,78,23,123,5,8
```

## 🚀 Import Commands

### Single File Import
```bash
# Import customers from JSON
npm run bulk-import -- customers data/customers.json json

# Import users from CSV
npm run bulk-import -- users data/users.csv csv

# Import with custom batch size
npm run bulk-import -- customers data/large-customers.json json 2000

# Clear existing data and import
npm run bulk-import -- customers data/customers.json json 1000 true
```

### Batch Import All Data
```bash
# Run the complete import script
npm run import-all-data
```

## ⚙️ Advanced Options

### Batch Size Recommendations
- **Small datasets** (<1k records): 500-1000
- **Medium datasets** (1k-10k): 1000-2000  
- **Large datasets** (>10k): 2000-5000
- **Activity logs**: 5000-10000 (they're simpler)

### Memory Considerations
- For very large files (>100MB), consider splitting into smaller files
- Monitor memory usage during import
- Use smaller batch sizes if you encounter memory issues

## 🔍 Troubleshooting

### Common Issues

1. **File not found**: Ensure file paths are correct relative to project root
2. **Invalid data format**: Check that required fields are present
3. **Memory errors**: Reduce batch size or split large files
4. **Duplicate emails**: Ensure email fields are unique for customers/users
5. **Date format errors**: Use ISO date strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)

### Error Logs
The import tool provides detailed error logs showing:
- Which records failed to import
- Why they failed (validation errors, etc.)
- Line numbers for easy debugging

## 📈 Performance Tips

1. **Use JSON for large datasets** - Generally faster to parse
2. **Optimize batch sizes** - Test with different sizes for your hardware
3. **Clear existing data** - Faster than checking for duplicates
4. **Run during off-peak hours** - Reduce database load
5. **Monitor disk space** - Ensure adequate space for database growth

## 🔒 Security Notes

- Never commit real customer data to version control
- Use `.gitignore` to exclude data files
- Consider data anonymization for development/testing
- Backup your database before large imports

## 📞 Support

If you encounter issues:
1. Check the error logs for specific error messages
2. Verify your data format matches the requirements
3. Test with a small sample file first
4. Check database connectivity and permissions