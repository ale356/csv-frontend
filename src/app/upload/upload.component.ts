import { Component } from "@angular/core";
import * as Papa from "papaparse";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { CommonModule } from "@angular/common";
import { FormBuilder } from "@angular/forms";

// Define the User interface without the id property
interface User {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

interface ValidationResult {
  user: User;
  validationResults: {
    FullName: boolean;
    Username: boolean;
    Email: boolean;
    Password: boolean;
  };
}

@Component({
  selector: "app-upload",
  standalone: true,
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.css"],
  imports: [CommonModule],
})
export class UploadComponent {
  users: User[] = [];
  invalidEntries: ValidationResult[] = [];
  selectedFile: File | null = null;
  apiUrl: string = environment.apiUrl;
  uploadStatusMessage: string = ''; // Message to show upload status
  isUploadSuccessful: boolean = false; // To track if the upload was successful

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      console.error("No file selected or file input is invalid.");
    }
  }

  // Parse CSV and perform client-side validation
  parseCSVAndValidate(): void {
    if (!this.selectedFile) {
      console.error("No file selected for upload.");
      return;
    }

    Papa.parse(this.selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result: Papa.ParseResult<any>) => {
        this.users = [];
        this.invalidEntries = [];

        result.data.forEach((userData: any) => {
          const user: User = {
            fullName: userData.FullName,
            username: userData.Username,
            email: userData.Email,
            password: userData.Password,
          };

          const validationResult = this.validateUser(user);
          if (validationResult) {
            this.invalidEntries.push(validationResult);
          } else {
            this.users.push(user);
          }
        });
      },
    });
  }

  // Validation logic for each user
  validateUser(user: User): ValidationResult | null {
    const validationResults = {
      FullName: true,
      Username: true,
      Email: true,
      Password: true,
    };

    // Full name validation
    if (!user.fullName || user.fullName.length > 100) {
      validationResults.FullName = false;
    }

    // Username validation
    if (!user.username || user.username.length > 100) {
      validationResults.Username = false;
    }

    // Email validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(user.email)) {
      validationResults.Email = false;
    }

    // Password validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(user.password)) {
      validationResults.Password = false;
    }

    const hasErrors = Object.values(validationResults).includes(false);
    return hasErrors ? { user, validationResults } : null;
  }

  // Check if the user is invalid by searching in the invalidEntries array
  isUserInvalid(user: User): boolean {
    return this.invalidEntries.some(
      (invalidEntry) => 
        invalidEntry.user.fullName === user.fullName &&
        invalidEntry.user.username === user.username &&
        invalidEntry.user.email === user.email &&
        invalidEntry.user.password === user.password
    );
  }

  // Upload valid users to the backend
  uploadUsers(): void {
    if (!this.selectedFile) {
      console.error("No file selected for upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", this.selectedFile);

    this.http.post(this.apiUrl, formData).subscribe(
      (response: any) => {
        this.users = response.savedUsers;
        this.invalidEntries = response.invalidEntries;
        this.uploadStatusMessage = "Valid users uploaded successfully!"; // Success message
        this.isUploadSuccessful = true; // Set success status
      },
      (error: any) => {
        console.error("Error uploading users:", error);
        this.uploadStatusMessage = "Failed to upload users."; // Error message
        this.isUploadSuccessful = false; // Set failure status
      }
    );
  }
}
