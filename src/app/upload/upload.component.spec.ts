import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { FormBuilder } from "@angular/forms";
import { UploadComponent } from "./upload.component";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";

// Helper function to create a mock file change event.
function createFileChangeEvent(file: File): Event {
  return {
    target: {
      files: [file],
    },
    type: "change",
    bubbles: true,
    cancelable: true,
    composed: true,
    currentTarget: null as any,
    preventDefault: () => {},
    stopPropagation: () => {},
  } as unknown as Event;
}

// Mocking the Papa Parse library.
const Papa = {
  parse: (file: File, options: any) => {
    const mockData = [
      {
        FullName: "John Doe",
        Username: "john.doe",
        Email: "john@example.com",
        Password: "Password1!",
      },
      {
        FullName: "Invalid User",
        Username: "",
        Email: "invalid.email",
        Password: "pass",
      },
    ];
    options.complete({ data: mockData });
  },
};

describe("UploadComponent", () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [
        { provide: "Papa", useValue: Papa },
        FormBuilder,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set the selected file on file selection", () => {
    const file = new File([""], "test.csv", { type: "text/csv" });
    const event = createFileChangeEvent(file);

    component.onFileSelected(event);
    expect(component.selectedFile).toBe(file);
  });

  it("should validate users correctly", () => {
    const validUser = {
      fullName: "Jane Doe",
      username: "jane.doe",
      email: "jane@example.com",
      password: "Password1!",
    };

    const invalidUser = {
      fullName: "",
      username: "user",
      email: "invalid-email",
      password: "short",
    };

    expect(component.validateUser(validUser)).toBeNull();
    expect(component.validateUser(invalidUser)).toBeTruthy();
  });

  it("should upload valid users to the backend", () => {
    const file = new File([""], "test.csv", { type: "text/csv" });
    const event = createFileChangeEvent(file);

    component.onFileSelected(event);
    component.parseCSVAndValidate();

    const formDataSpy = spyOn(window, "FormData").and.callThrough();

    component.uploadUsers();

    const req = httpMock.expectOne(`${component.apiUrl}`);
    expect(req.request.method).toEqual("POST");

    // Simulate backend response.
    req.flush({
      savedUsers: component.users,
      invalidEntries: component.invalidEntries,
    });

    expect(formDataSpy).toHaveBeenCalled();
  });

  it("should handle successful upload response", () => {
    const file = new File([""], "test.csv", { type: "text/csv" });
    const event = createFileChangeEvent(file);

    component.onFileSelected(event);
    component.parseCSVAndValidate();

    component.uploadUsers();

    const req = httpMock.expectOne(`${component.apiUrl}`);
    expect(req.request.method).toEqual("POST");

    req.flush({
      savedUsers: component.users,
      invalidEntries: component.invalidEntries,
    });

    expect(component.uploadStatusMessage).toEqual(
      "Valid users uploaded successfully!"
    );
    expect(component.isUploadSuccessful).toBeTrue();
  });

  it("should handle error during upload", () => {
    const file = new File([""], "test.csv", { type: "text/csv" });
    const event = createFileChangeEvent(file);

    component.onFileSelected(event);
    component.parseCSVAndValidate();

    component.uploadUsers();

    const req = httpMock.expectOne(`${component.apiUrl}`);
    expect(req.request.method).toEqual("POST");

    req.error(new ErrorEvent("Network error"));

    expect(component.uploadStatusMessage).toEqual("Failed to upload users.");
    expect(component.isUploadSuccessful).toBeFalse();
  });

  afterEach(() => {
    // Verify that no unmatched requests are outstanding.
    httpMock.verify();
  });
});
