"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { parseQRCodeData } from '@/lib/qrCodeUtils'
import jsQR from 'jsqr'

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
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Check for camera permission and availability
    const checkCameraPermission = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Camera not supported on this device')
                return false
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            // Stop the stream immediately after checking permission
            stream.getTracks().forEach(track => track.stop())
            setHasPermission(true)
            setError(null)
            return true
        } catch (err: any) {
            console.error('Camera permission error:', err)
            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please allow camera access to scan QR codes.')
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.')
            } else if (err.name === 'NotReadableError') {
                setError('Camera is already in use by another application.')
            } else {
                setError('Unable to access camera. Please check your device settings.')
            }
            setHasPermission(false)
            return false
        }
    }, [])

    // Start camera stream
    const startCamera = useCallback(async () => {
        try {
            setIsLoading(true)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                streamRef.current = stream

                // Wait for video to be ready
                videoRef.current.onloadedmetadata = () => {
                    setIsLoading(false)
                }
            }
        } catch (err) {
            console.error('Error starting camera:', err)
            setError('Failed to start camera')
            setIsLoading(false)
        }
    }, [])

    // Stop camera stream
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
    }, [])

    // QR Code detection using jsQR
    const detectQRCode = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

        // Set canvas size to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

        // Use jsQR to detect QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        })

        if (code) {
            console.log('QR Code detected:', code.data)

            try {
                const parsedData = parseQRCodeData(code.data)
                if (parsedData) {
                    setScannedData(parsedData)
                    onScan({
                        shareableId: parsedData.shareableId,
                        cardName: parsedData.cardName,
                        userName: parsedData.userName,
                        userEmail: parsedData.userEmail
                    })
                    setIsScanning(false)
                    stopCamera()
                    setIsOpen(false)
                } else {
                    console.log('Invalid QR code format - expected bank transfer data')
                }
            } catch (err) {
                console.error('Error parsing QR code data:', err)
            }
        }
    }, [onScan, stopCamera])

    // Start scanning
    const handleStartScan = useCallback(async () => {
        setError(null)
        setIsScanning(true)

        if (hasPermission === null) {
            const hasCam = await checkCameraPermission()
            if (!hasCam) return
        }

        if (hasPermission) {
            await startCamera()

            // Start QR detection loop after a short delay to ensure video is ready
            setTimeout(() => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    scanIntervalRef.current = setInterval(detectQRCode, 100) // Check every 100ms
                }
            }, 1000)
        }
    }, [hasPermission, checkCameraPermission, startCamera, detectQRCode])

    // Stop scanning
    const handleStopScan = useCallback(() => {
        setIsScanning(false)
        stopCamera()
    }, [stopCamera])

    // Handle sheet open/close
    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open)
        if (!open) {
            handleStopScan()
        }
    }, [handleStopScan])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [stopCamera])

    // Check camera permission on mount
    useEffect(() => {
        checkCameraPermission()
    }, [checkCameraPermission])

    return (
        <div className="w-full">
            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
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
                <SheetContent className="w-full sm:max-w-md bg-white">
                    <SheetHeader>
                        <SheetTitle>Scan QR Code</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col items-center justify-center py-8 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
                                <div className="flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    <span className="text-sm text-red-800">{error}</span>
                                </div>
                            </div>
                        )}

                        <div className="w-full max-w-sm">
                            <div className="relative w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-black">
                                {isScanning ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="hidden"
                                        />
                                        {/* Scanning overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                                                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                                                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="animate-pulse">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {isLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                                <div className="text-center text-white">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                                    <p className="text-sm">Starting camera...</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full ">
                                        <div className="text-center text-gray-600">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4">
                                                <rect x="3" y="3" width="5" height="5" />
                                                <rect x="16" y="3" width="5" height="5" />
                                                <rect x="3" y="16" width="5" height="5" />
                                                <rect x="16" y="16" width="5" height="5" />
                                                <rect x="8" y="3" width="8" height="2" />
                                                <rect x="8" y="19" width="8" height="2" />
                                                <rect x="3" y="8" width="2" height="8" />
                                                <rect x="19" y="8" width="2" height="8" />
                                            </svg>
                                            <p className="text-sm">Position QR code within frame</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 w-full">
                            {!isScanning ? (
                                <Button
                                    onClick={handleStartScan}
                                    disabled={hasPermission === false || isLoading}
                                    className="flex-1 shadow-md hover:shadow-lg"
                                >
                                    {isLoading ? 'Starting...' : hasPermission === false ? 'Camera Not Available' : 'Start Scanning'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStopScan}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Stop Scanning
                                </Button>
                            )}
                        </div>

                        <div className="text-center text-sm text-gray-500">
                            <p>Scan a QR code to automatically fill recipient details</p>
                            {hasPermission === false && (
                                <p className="text-red-500 mt-1">Camera access is required to scan QR codes</p>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default PaymentQRScanner