import { registerSocketHandlers } from '../../src/socket/socketHandlers';
import { User } from '../../src/models/User';
import { Ride } from '../../src/models/Ride';

// Mock DB Models
jest.mock('../../src/models/User');
jest.mock('../../src/models/Ride');

// Mock Redis Config
jest.mock('../../src/config/redis', () => ({
  invalidateCache: jest.fn().mockResolvedValue(undefined),
}));

describe('Socket Handlers Unit Tests', () => {
  let mockIo: any;
  let mockSocket: any;
  let connectionHandler: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket = {
      id: 'test-socket-id',
      data: {
        userId: 'test-user-123',
        role: 'driver',
      },
      rooms: new Set(['test-socket-id']),
      join: jest.fn().mockImplementation((room) => {
        mockSocket.rooms.add(room);
      }),
      leave: jest.fn().mockImplementation((room) => {
        mockSocket.rooms.delete(room);
      }),
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    mockIo = {
      use: jest.fn(),
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
      }),
      to: jest.fn().mockImplementation(() => ({
        emit: jest.fn(),
      })),
      emit: jest.fn(),
    };
  });

  it('should register connection handler and join default rooms', () => {
    registerSocketHandlers(mockIo);
    expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));

    // Simulate connection
    connectionHandler(mockSocket);
    expect(mockSocket.join).toHaveBeenCalledWith('user:test-user-123');
    expect(mockSocket.join).toHaveBeenCalledWith('drivers');
  });

  it('should register correct event listeners on connection', () => {
    registerSocketHandlers(mockIo);
    connectionHandler(mockSocket);

    const registeredEvents = mockSocket.on.mock.calls.map((call: any) => call[0]);
    expect(registeredEvents).toContain('driver:location-update');
    expect(registeredEvents).toContain('driver:toggle-availability');
    expect(registeredEvents).toContain('join:room');
    expect(registeredEvents).toContain('leave:room');
  });

  it('should handle driver location updates', async () => {
    registerSocketHandlers(mockIo);
    connectionHandler(mockSocket);

    const locationUpdateHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'driver:location-update'
    )[1];

    const mockPayload = {
      coordinates: { lat: 40.7128, lng: -74.006 },
    };

    const findByIdAndUpdateSpy = jest
      .spyOn(User, 'findByIdAndUpdate')
      .mockResolvedValue({} as any);

    await locationUpdateHandler(mockPayload);

    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith('test-user-123', {
      $set: {
        currentLocation: {
          type: 'Point',
          coordinates: [-74.006, 40.7128],
        },
      },
    });
  });
});
