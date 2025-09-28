export interface QRCodeData {
    type: 'bank_transfer'
    shareableId: string
    cardName: string
    userName: string
    userEmail: string
    timestamp: number
    version: string
}

export const parseQRCodeData = (qrString: string): QRCodeData | null => {
    try {
        const data = JSON.parse(qrString)
        if (data.type === 'bank_transfer' && data.shareableId) {
            return data as QRCodeData
        }
        return null
    } catch (error) {
        console.error('Error parsing QR code data:', error)
        return null
    }
}

export const createQRCodeData = (
    shareableId: string,
    cardName: string,
    userName: string,
    userEmail: string
): QRCodeData => {
    return {
        type: 'bank_transfer',
        shareableId,
        cardName,
        userName,
        userEmail,
        timestamp: Date.now(),
        version: '1.0'
    }
}