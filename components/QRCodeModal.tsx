"use client"

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
// import { Copy } from './Copy'

interface QRCodeModalProps {
    shareableId: string
    cardName: string
    userName: string
    cardMask: string
    userEmail: string  // Add email prop
}

const QRCodeModal = ({ shareableId, cardName, userName, cardMask, userEmail }: QRCodeModalProps) => {
    const [qrCodeData, setQrCodeData] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    // Generate QR code data structure
    const generateQRData = () => {
        return {
            type: 'bank_transfer',
            shareableId: shareableId,
            cardName: cardName,
            userName: userName,
            userEmail: userEmail,  // Add email prop
            timestamp: Date.now(),
            version: '1.0'
        }
    }

    // Generate proper QR code using qrcode library
    const generateQRCode = async () => {
        setIsLoading(true)
        try {
            const qrData = generateQRData()
            const qrString = JSON.stringify(qrData)

            // Generate actual QR code
            const dataUrl = await QRCode.toDataURL(qrString, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            })

            setQrCodeData(dataUrl)
        } catch (error) {
            console.error('Error generating QR code:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (shareableId) {
            generateQRCode()
        }
    }, [shareableId])

    const handleDownload = () => {
        if (qrCodeData) {
            const link = document.createElement('a')
            link.download = `qr-code-${cardName.replace(/\s+/g, '-').toLowerCase()}.png`
            link.href = qrCodeData
            link.click()
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="5" height="5" />
                        <rect x="16" y="3" width="5" height="5" />
                        <rect x="3" y="16" width="5" height="5" />
                        <rect x="16" y="16" width="5" height="5" />
                        <rect x="8" y="3" width="8" height="2" />
                        <rect x="8" y="19" width="8" height="2" />
                        <rect x="3" y="8" width="2" height="8" />
                        <rect x="19" y="8" width="2" height="8" />
                    </svg>
                    QR Code
                </Button>
            </SheetTrigger>
            <SheetContent className='bg-white'>
                <SheetHeader>
                    <SheetTitle>QR Code for {cardName}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                    {/* QR Code Display */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-100">
                        {isLoading ? (
                            <div className="w-64 h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <img
                                src={qrCodeData}
                                alt="QR Code"
                                className="w-64 h-64"
                            />
                        )}
                    </div>

                    {/* Card Information */}
                    <div className="text-center space-y-2">
                        <h3 className="font-semibold text-lg text-gray-900">{cardName}</h3>
                        <p className="text-sm text-gray-600">{userName}</p>
                        <p className="text-xs text-gray-500">Card: •••• {cardMask}</p>
                    </div>

                    {/* Shareable ID Display */}
                    <div className="w-full max-w-sm">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Shareable ID
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={shareableId}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                            />
                            {/* <Copy title={shareableId} /> */}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-center text-sm text-gray-500 max-w-sm">
                        <p className="mb-2">Scan this QR code to send money to this account</p>
                        <p className="text-xs">The QR code contains your unique shareable ID</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7,10 12,15 17,10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download
                        </Button>
                        <Button
                            onClick={() => navigator.share?.({
                                title: `${cardName} QR Code`,
                                text: `Send money to ${userName}`,
                                url: qrCodeData
                            })}
                            variant="default"
                            className="flex items-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            Share
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default QRCodeModal