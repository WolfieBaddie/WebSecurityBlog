export interface DriveUploadResult
{
    fileId: string;
    directUrl: string;
    webViewLink: string;
}

export class GoogleDriveService
{
    private clientEmail: string;
    private privateKey: string;
    private folderId: string;

    constructor()
    {
        this.clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
        this.privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    }

    private async getAccesToken(): Promise<string>
    {
        if(!this.clientEmail || !this.privateKey)
            throw new Error('Google Service Account credentials are missing');

        const now = Math.floor(Date.now() / 1000);
        const header = {alg: 'RS256', typ: 'JWT'}
        const claimSet = 
        {
            iss: this.clientEmail,
            scope: 'https://googleapis.com/auth/drive',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        }

        const b64 = (obj : any) =>
            btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const unsignedToken = `${b64(header)}.${b64(claimSet)}`;

        const pemContents = this.privateKey
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s+/g, '');


        const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(8))

        const cryptoKey = await crypto.subtle.importKey(
            
                'pkcs8',
                binaryKey,
                {name: "RSASSA-PKCS1-v1_5", hash: 'SHA-256'},
                false,
                ['sign']
            );

        const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsignedToken));

        const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
       .replace(/\+/g, '-')
       .replace(/\//g, '_')
       .replace(/=+$/, '');

       const jwt = `${unsignedToken}.${signatureB64}`;

       const tokenRes = await fetch('https://oauth2.googleapis.com/token' 
        ,{
            method: 'POST',
            headers: {'Content-Type' : 'application/x-www-form-urlencoded'},
              body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        })

        const tokenData = await tokenRes.json();

        if(!tokenRes.ok)
            throw new Error(`Google Auth Failed: ${tokenData.error_description || tokenData.error}`);

        return tokenData.access_token;
    }

    async uploadFile(file: File, customeName?: string): Promise<DriveUploadResult>
    {
        const accessToken = await this.getAccesToken();
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const metadata = 
        {
            name: customeName || file.name,
            mimeType: file.type,
            parents: this.folderId ? [this.folderId]: undefined
        };

        const fileBuffer = await file.arrayBuffer();

        const multipartRequestBody = new Blob(
            [
                delimiter,
                'Content-Type : application/json; charset = UYTF-8\r\n\r\n',
                JSON.stringify(metadata),
                delimiter,
                `Content-Type: ${file.type}\r\n`,
                'Content-Transfer-Encoding: base64\r\n\r\n',
                btoa(String.fromCharCode(...new Uint8Array(fileBuffer))),
                closeDelimiter
            ]);


        const uploadRes = await fetch
        (
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
            {
                method : 'POST',
                headers: 
                {
                    Authorizaiton: `Bearer ${accessToken}`,
                    'Content-Type': `multipart/related; boundary = ${boundary}`,
                },
                body: multipartRequestBody
            }
        )

        const uploadData = await uploadRes.json();

        if(!uploadData.ok)
            throw new Error(`Google Drive Upload Error: ${uploadData.error?.message || 'Upload failed'}`);

            await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    // lh3.googleusercontent CDN URL format works universally for image embeddings
    const directUrl = `https://lh3.googleusercontent.com/d/${uploadData.id}`;

    return {
      fileId: uploadData.id,
      directUrl,
      webViewLink: uploadData.webViewLink,
    };
    }
}

export const googleDriveService = new GoogleDriveService();