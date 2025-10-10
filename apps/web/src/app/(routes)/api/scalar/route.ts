import { NextRequest, NextResponse } from 'next/server';

export const GET = async (_eq: NextRequest) => {
  return new NextResponse(
    `<!doctype html>
    <html>
      <head>
        <title>Easylog API</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="https://orpc.unnoq.com/icon.svg" />
      </head>
      <body>
        <div id="app"></div>

        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app', {
            url: '/api/openapi',
            authentication: {
              securitySchemes: {
                bearerAuth: {
                  token: 'default-token',
                },
              },
            },
          })
        </script>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html'
      }
    }
  );
};
