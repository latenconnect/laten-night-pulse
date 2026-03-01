// DiscoverView.swift
// Laten — Discover Tab (Apple Maps + Event Feed)

import SwiftUI
import MapKit

struct DiscoverView: View {
    @StateObject private var viewModel = DiscoverViewModel()
    @State private var selectedSegment = 0
    @State private var selectedEvent: LatenEvent?
    
    var body: some View {
        VStack(spacing: 0) {
            // Segmented Control: Map / Feed
            Picker("View", selection: $selectedSegment) {
                Text("Map").tag(0)
                Text("Feed").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.top, 8)
            
            if selectedSegment == 0 {
                mapView
            } else {
                feedView
            }
        }
        .navigationTitle("Discover")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    // Search
                } label: {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.latenPurple)
                }
            }
        }
        .task {
            await viewModel.fetchEvents()
            await viewModel.fetchClubs()
        }
    }
    
    // MARK: - Map View (Apple Maps)
    private var mapView: some View {
        Map(coordinateRegion: $viewModel.region, annotationItems: viewModel.mapAnnotations) { item in
            MapAnnotation(coordinate: item.coordinate) {
                mapPin(for: item)
                    .onTapGesture {
                        if let event = item.event {
                            selectedEvent = event
                        }
                    }
            }
        }
        .mapStyle(.standard(elevation: .realistic, pointsOfInterest: .excludingAll))
        .ignoresSafeArea(edges: .bottom)
        .sheet(item: $selectedEvent) { event in
            EventDetailSheet(event: event)
                .presentationDetents([.medium, .large])
        }
    }
    
    // MARK: - Map Pin
    private func mapPin(for item: MapAnnotationItem) -> some View {
        ZStack {
            Circle()
                .fill(item.isClub ? Color.latenAmber : (item.isFeatured ? Color.latenPurple : Color.latenCyan))
                .frame(width: item.isClub ? 12 : 16, height: item.isClub ? 12 : 16)
                .shadow(color: (item.isClub ? Color.latenAmber : Color.latenPurple).opacity(0.6), radius: 8)
            
            if item.isFeatured {
                Circle()
                    .stroke(Color.latenPurple.opacity(0.4), lineWidth: 2)
                    .frame(width: 24, height: 24)
            }
        }
    }
    
    // MARK: - Feed View
    private var feedView: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Category Filters
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(EventType.allCases, id: \.self) { type in
                            Button {
                                viewModel.selectedType = viewModel.selectedType == type ? nil : type
                            } label: {
                                HStack(spacing: 4) {
                                    Text(type.icon)
                                    Text(type.label)
                                        .font(.latenCaption())
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(viewModel.selectedType == type ? Color.latenPurple : Color.latenSurface)
                                .foregroundColor(.white)
                                .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                }
                
                // Event Cards
                ForEach(viewModel.filteredEvents) { event in
                    EventCardView(event: event)
                        .padding(.horizontal, 16)
                        .onTapGesture {
                            selectedEvent = event
                        }
                }
                
                if viewModel.filteredEvents.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "party.popper")
                            .font(.system(size: 40))
                            .foregroundColor(.latenTextMuted)
                        Text("No events found")
                            .font(.latenBody())
                            .foregroundColor(.latenTextSecondary)
                    }
                    .padding(.top, 60)
                }
            }
            .padding(.top, 12)
        }
        .refreshable {
            await viewModel.fetchEvents()
        }
    }
}

// MARK: - ViewModel
@MainActor
class DiscoverViewModel: ObservableObject {
    @Published var events: [LatenEvent] = []
    @Published var clubs: [Club] = []
    @Published var selectedType: EventType?
    @Published var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 47.4979, longitude: 19.0402),
        span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08)
    )
    
    var filteredEvents: [LatenEvent] {
        guard let type = selectedType else { return events }
        return events.filter { $0.type == type }
    }
    
    var mapAnnotations: [MapAnnotationItem] {
        var items: [MapAnnotationItem] = []
        
        for event in events {
            if let coord = event.coordinate {
                items.append(.init(
                    id: event.id.uuidString,
                    coordinate: coord,
                    isClub: false,
                    isFeatured: event.isFeatured ?? false,
                    event: event
                ))
            }
        }
        
        for club in clubs {
            items.append(.init(
                id: club.id.uuidString,
                coordinate: club.coordinate,
                isClub: true,
                isFeatured: club.isFeatured ?? false,
                event: nil
            ))
        }
        
        return items
    }
    
    func fetchEvents() async {
        do {
            events = try await supabase
                .from("events")
                .select()
                .eq("is_active", value: true)
                .order("start_time", ascending: true)
                .limit(50)
                .execute()
                .value
        } catch {
            print("Failed to fetch events: \(error)")
        }
    }
    
    func fetchClubs() async {
        do {
            clubs = try await supabase
                .from("clubs")
                .select()
                .eq("is_active", value: true)
                .limit(100)
                .execute()
                .value
        } catch {
            print("Failed to fetch clubs: \(error)")
        }
    }
}

// MARK: - Map Annotation Item
struct MapAnnotationItem: Identifiable {
    let id: String
    let coordinate: CLLocationCoordinate2D
    let isClub: Bool
    let isFeatured: Bool
    let event: LatenEvent?
}

// MARK: - Event Card
struct EventCardView: View {
    let event: LatenEvent
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Cover image placeholder
            ZStack(alignment: .topTrailing) {
                if let imageUrl = event.coverImage, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image.resizable().aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Rectangle().fill(Color.latenSurface)
                    }
                    .frame(height: 160)
                    .clipped()
                    .cornerRadius(12)
                } else {
                    Rectangle()
                        .fill(LinearGradient.latenGlow.opacity(0.3))
                        .frame(height: 160)
                        .cornerRadius(12)
                        .overlay(
                            Image(systemName: "music.note")
                                .font(.system(size: 32))
                                .foregroundColor(.latenTextMuted)
                        )
                }
                
                if event.isFeatured == true {
                    Text("⭐ Featured")
                        .font(.latenSmall())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.latenPurple)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                        .padding(8)
                }
            }
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(event.type.icon)
                    Text(event.name)
                        .font(.latenHeadline())
                        .foregroundColor(.latenTextPrimary)
                        .lineLimit(1)
                }
                
                HStack(spacing: 12) {
                    Label(event.locationName, systemImage: "mappin")
                    if let price = event.price, price > 0 {
                        Label("€\(Int(price))", systemImage: "ticket")
                    } else {
                        Label("Free", systemImage: "ticket")
                            .foregroundColor(.latenSuccess)
                    }
                }
                .font(.latenCaption())
                .foregroundColor(.latenTextSecondary)
                
                HStack {
                    Label(formattedDate(event.startTime), systemImage: "clock")
                    Spacer()
                    if let rsvp = event.actualRsvp, rsvp > 0 {
                        Label("\(rsvp) going", systemImage: "person.2")
                    }
                }
                .font(.latenSmall())
                .foregroundColor(.latenTextMuted)
            }
            .padding(.horizontal, 4)
        }
        .cardStyle()
    }
    
    private func formattedDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: dateString) else { return dateString }
        let display = DateFormatter()
        display.dateFormat = "MMM d, HH:mm"
        return display.string(from: date)
    }
}

// MARK: - Event Detail Sheet
struct EventDetailSheet: View {
    let event: LatenEvent
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                HStack {
                    Text(event.type.icon)
                        .font(.system(size: 28))
                    Text(event.name)
                        .font(.latenTitle())
                        .foregroundColor(.latenTextPrimary)
                }
                
                // Details
                VStack(alignment: .leading, spacing: 10) {
                    Label(event.locationName, systemImage: "mappin.circle.fill")
                    if let address = event.locationAddress {
                        Label(address, systemImage: "map")
                    }
                    Label(event.startTime, systemImage: "calendar")
                    if let price = event.price, price > 0 {
                        Label("€\(Int(price))", systemImage: "eurosign.circle")
                    } else {
                        Label("Free entry", systemImage: "checkmark.circle")
                            .foregroundColor(.latenSuccess)
                    }
                    if let age = event.ageLimit, age > 0 {
                        Label("\(age)+ only", systemImage: "person.badge.shield.checkmark")
                    }
                }
                .font(.latenBody())
                .foregroundColor(.latenTextSecondary)
                
                if let description = event.description {
                    Text(description)
                        .font(.latenBody())
                        .foregroundColor(.latenTextSecondary)
                }
                
                // RSVP Button
                Button {
                    // RSVP action
                } label: {
                    Text("RSVP")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(LinearGradient.latenGlow)
                        .cornerRadius(12)
                }
                .padding(.top, 8)
            }
            .padding(20)
        }
        .background(Color.latenBackground)
    }
}
