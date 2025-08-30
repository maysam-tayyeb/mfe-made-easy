#!/bin/bash

# Update authorization service
echo "Updating authorization service..."
cat >> packages/mfe-toolkit-service-authorization/src/types.ts << 'EOF'

// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    authorization: AuthorizationService;
  }
}
EOF

sed -i.bak '/declare module.*@mfe-toolkit\/core/,/^}/d' packages/mfe-toolkit-service-authorization/src/index.ts
echo "// Module augmentation is now in ./types.ts for lighter imports" >> packages/mfe-toolkit-service-authorization/src/index.ts
rm packages/mfe-toolkit-service-authorization/src/index.ts.bak 2>/dev/null

# Update theme service
echo "Updating theme service..."
cat >> packages/mfe-toolkit-service-theme/src/types.ts << 'EOF'

// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    theme: ThemeService;
  }
}
EOF

sed -i.bak '/declare module.*@mfe-toolkit\/core/,/^}/d' packages/mfe-toolkit-service-theme/src/index.ts
echo "// Module augmentation is now in ./types.ts for lighter imports" >> packages/mfe-toolkit-service-theme/src/index.ts
rm packages/mfe-toolkit-service-theme/src/index.ts.bak 2>/dev/null

# Update analytics service
echo "Updating analytics service..."
cat >> packages/mfe-toolkit-service-analytics/src/types.ts << 'EOF'

// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    analytics: AnalyticsService;
  }
}
EOF

sed -i.bak '/declare module.*@mfe-toolkit\/core/,/^}/d' packages/mfe-toolkit-service-analytics/src/index.ts
echo "// Module augmentation is now in ./types.ts for lighter imports" >> packages/mfe-toolkit-service-analytics/src/index.ts
rm packages/mfe-toolkit-service-analytics/src/index.ts.bak 2>/dev/null

echo "Done!"