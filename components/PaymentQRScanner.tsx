"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { parseQRCodeData } from '@/lib/qrCodeUtils'

interface PaymentQRScannerProps {
    onScan: (data: {
        shareableId: string;
        cardName: string;
        userName: string;
        userEmail: string;
    }) => void
}

const PaymentQRScanner = ({ onScan }: PaymentQRScannerProps) => {
    const [isScanning, setIsScanning] = useState(false)
    const [scannedData, setScannedData] = useState<any>(null)

    const handleScan = () => {
        setIsScanning(true)

        // Simulate QR code scanning
        // In a real implementation, you'd use a camera-based QR scanner
        setTimeout(() => {
            // Mock QR code data that would be scanned from another user's QR code
            const mockQRData = {
                type: 'bank_transfer',
                shareableId: 'UnpNcGpObThxV1U4WDhxTThhbnZTWE14NEVvNlhrQ1BMa1ZBRQ==',
                cardName: 'Plaid Checking',
                userName: 'John Doe',
                userEmail: 'john.doe@email.com',
                timestamp: Date.now(),
                version: '1.0'
            }

            // Parse the QR code data
            const qrString = JSON.stringify(mockQRData)
            const parsedData = parseQRCodeData(qrString)

            if (parsedData) {
                setScannedData(parsedData)
                onScan({
                    shareableId: parsedData.shareableId,
                    cardName: parsedData.cardName,
                    userName: parsedData.userName,
                    userEmail: parsedData.userEmail
                })
            }

            setIsScanning(false)
        }, 2000)
    }

    return (
        <div className="w-full">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="5" height="5" />
                            <rect x="16" y="3" width="5" height="5" />
                            <rect x="3" y="16" width="5" height="5" />
                            <rect x="16" y="16" width="5" height="5" />
                            <rect x="8" y="3" width="8" height="2" />
                            <rect x="8" y="19" width="8" height="2" />
                            <rect x="3" y="8" width="2" height="8" />
                            <rect x="19" y="8" width="2" height="8" />
                        </svg>
                        Scan QR Code to Pay
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Scan QR Code</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col items-center justify-center py-8 space-y-6">
                        <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            {isScanning ? (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-sm text-gray-600">Scanning QR Code...</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4 text-gray-400">
                                        <rect x="3" y="3" width="5" height="5" />
                                        <rect x="16" y="3" width="5" height="5" />
                                        <rect x="3" y="16" width="5" height="5" />
                                        <rect x="16" y="16" width="5" height="5" />
                                        <rect x="8" y="3" width="8" height="2" />
                                        <rect x="8" y="19" width="8" height="2" />
                                        <rect x="3" y="8" width="2" height="8" />
                                        <rect x="19" y="8" width="2" height="8" />
                                    </svg>
                                    <p className="text-sm text-gray-600">Position QR code within frame</p>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleScan}
                            disabled={isScanning}
                            className="w-full"
                        >
                            {isScanning ? 'Scanning...' : 'Start Scanning'}
                        </Button>

                        <div className="text-center text-sm text-gray-500">
                            <p>Scan a QR code to automatically fill recipient details</p>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default PaymentQRScanner