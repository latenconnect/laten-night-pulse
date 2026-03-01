// LocationService.swift
// Laten — CoreLocation Manager

import Foundation
import CoreLocation
import SwiftUI

@MainActor
class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let shared = LocationService()
    
    private let manager = CLLocationManager()
    
    @Published var currentLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var locationError: String?
    
    private var locationContinuation: CheckedContinuation<CLLocation, Error>?
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        authorizationStatus = manager.authorizationStatus
    }
    
    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }
    
    func requestAlwaysPermission() {
        manager.requestAlwaysAuthorization()
    }
    
    /// Get current location as a one-shot async call
    func getCurrentLocation() async throws -> CLLocation {
        // Check authorization
        switch manager.authorizationStatus {
        case .notDetermined:
            requestPermission()
            // Wait briefly for user to respond
            try await Task.sleep(nanoseconds: 2_000_000_000)
        case .denied, .restricted:
            throw LocationError.permissionDenied
        default:
            break
        }
        
        return try await withCheckedThrowingContinuation { continuation in
            locationContinuation = continuation
            manager.requestLocation()
        }
    }
    
    // MARK: - CLLocationManagerDelegate
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        Task { @MainActor in
            currentLocation = location
            locationContinuation?.resume(returning: location)
            locationContinuation = nil
        }
    }
    
    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            locationError = error.localizedDescription
            locationContinuation?.resume(throwing: error)
            locationContinuation = nil
        }
    }
    
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            authorizationStatus = manager.authorizationStatus
        }
    }
}

enum LocationError: LocalizedError {
    case permissionDenied
    case locationUnavailable
    
    var errorDescription: String? {
        switch self {
        case .permissionDenied: return "Location permission denied. Enable in Settings."
        case .locationUnavailable: return "Unable to determine location."
        }
    }
}
