import { agentAPI, API_BASE_URL } from './api';
import { compressImage } from './imageCompress';

export interface VisitData {
  shop?: {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  location: {
    lat: number;
    lng: number;
  } | null; // Make location optional
  visitType: 'individual' | 'customer';
  responses: Record<string, unknown>;
  photos?: File[];
  notes?: string;
  brandId?: number;
  categoryId?: number;
  productId?: number;
}

export class VisitService {
  /**
   * Convert a File to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    // Compress the image before converting to base64
    const compressedFile = await compressImage(file, 1, 1280); // 1MB max, 1280px max dimension
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Create a complete visit with checkin and visit response
   */
  static async createVisit(visitData: VisitData): Promise<{ checkinId: number; visitResponseId?: number }> {
    try {
      // Create checkin with photo and survey data in one request
      const formData = new FormData();
        if (visitData.shop) {
          formData.append("shop_id", visitData.shop.id.toString());
        }
        if (visitData.brandId) {
          formData.append("brand_id", visitData.brandId.toString());
        }
        if (visitData.categoryId) {
          formData.append("category_id", visitData.categoryId.toString());
        }
        if (visitData.productId) {
          formData.append("product_id", visitData.productId.toString());
        }
        
        // Handle optional location - only append if available
        if (visitData.location) {
          formData.append("latitude", visitData.location.lat.toString());
          formData.append("longitude", visitData.location.lng.toString());
        } else {
          // For individual visits without location, use default coordinates or empty
          formData.append("latitude", "0");
          formData.append("longitude", "0");
        }
        
        formData.append("notes", visitData.notes || '');
        formData.append("visit_type", visitData.visitType);
        // Always stringify responses if present
        if (visitData.responses) {
          let responsesStr: string;
          if (typeof visitData.responses === 'string') {
            responsesStr = visitData.responses;
          } else {
            try {
              responsesStr = JSON.stringify(visitData.responses);
            } catch (e) {
              throw new Error('Failed to serialize responses to JSON');
            }
          }
          formData.append("responses", responsesStr);
        }

      // Convert images to base64 for database storage
      if (visitData.photos && visitData.photos.length > 0) {
        // Compress and convert photos to base64 with aggressive compression
        const compressedPhotos = await Promise.all(
          visitData.photos.map(photo => compressImage(photo, 0.2, 800))
        );
        
        // Convert main photo to base64
        const mainPhotoBase64 = await VisitService.fileToBase64(compressedPhotos[0]);
        formData.append('photo_base64', mainPhotoBase64);
        
        // Convert additional photos to base64 if any
        if (compressedPhotos.length > 1) {
          const additionalPhotosBase64 = await Promise.all(
            compressedPhotos.slice(1).map(photo => VisitService.fileToBase64(photo))
          );
          formData.append('additional_photos_base64', JSON.stringify(additionalPhotosBase64));
        }
      } else {
        // For individual visits, photos are optional - don't create dummy photos
        if (visitData.visitType === 'individual') {
          // For individual visits, send empty string to indicate no photo required
          formData.append('photo_base64', '');
        } else {
          // For other visit types, create a dummy 1x1 pixel base64 image if no photo provided
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1, 1);
          }
          // Convert canvas to base64
          const dummyBase64 = canvas.toDataURL('image/jpeg', 0.1);
          formData.append('photo_base64', dummyBase64);
        }
      }

      // Create checkin via direct fetch (since agentAPI doesn't have formData support)
      const token = localStorage.getItem('auth_token');
      console.log('Sending checkin request with form data...');
      
      // Log form data entries for debugging (excluding file contents)
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`Form data: ${pair[0]} = [File: ${pair[1].name}, ${pair[1].size} bytes]`);
        } else {
          console.log(`Form data: ${pair[0]} = ${pair[1]}`);
        }
      }
      
      const checkinResponse = await fetch(`${API_BASE_URL}/agent/checkin`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      let data;
      let responseText = '';
      try {
        // First try to get the raw text response for debugging
        responseText = await checkinResponse.clone().text();
        console.log('Raw response:', responseText);
        
        // Then parse as JSON if possible
        data = await checkinResponse.json();
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        console.error('Response text:', responseText);
        
        // If not JSON, likely an HTML error page
        throw new Error(`Server returned invalid JSON. Status: ${checkinResponse.status}. Response: ${responseText.substring(0, 100)}...`);
      }

        if (!checkinResponse.ok) {
          throw new Error(data.error || 'Failed to create checkin');
        }

        return {
          checkinId: data.id,
          visitResponseId: data.visit_response ? data.visit_response.id : undefined,
        };
    } catch (error) {
      console.error('Failed to create visit:', error);
      throw error;
    }
  }

  /**
   * Get visit response for a checkin
   */
  static async getVisitResponse(checkinId: number) {
    try {
      return await agentAPI.getVisitResponse(checkinId);
    } catch (error) {
      console.error('Failed to get visit response:', error);
      throw error;
    }
  }

  /**
   * Update existing visit response
   */
  static async updateVisitResponse(
    checkinId: number, 
    updates: { visit_type?: 'individual' | 'customer'; responses?: Record<string, unknown> }
  ) {
    try {
      return await agentAPI.updateVisitResponse(checkinId, updates);
    } catch (error) {
      console.error('Failed to update visit response:', error);
      throw error;
    }
  }

  /**
   * Get all visit responses for current agent
   */
  static async getAllVisitResponses() {
    try {
      return await agentAPI.getAllVisitResponses();
    } catch (error) {
      console.error('Failed to get all visit responses:', error);
      throw error;
    }
  }

  /**
   * Transform form data to the expected response format
   */
  static transformIndividualVisitData(formData: Record<string, unknown>): Record<string, unknown> {
    return {
      brandInfo: {
        brandInfoGiven: formData.brandInfoGiven
      },
      consumerDetails: {
        consumerName: formData.consumerName,
        consumerSurname: formData.consumerSurname,
        idPassportNumber: formData.idPassportNumber,
        cellphoneNumber: formData.cellphoneNumber,
        goldrushId: formData.goldrushId
      },
      conversion: {
        converted: formData.converted
      },
      bettingInfo: {
        isBettingSomewhere: formData.isBettingSomewhere,
        currentBettingCompany: formData.currentBettingCompany,
        usedGoldrushBefore: formData.usedGoldrushBefore,
        goldrushComparison: formData.goldrushComparison,
        likesGoldrush: formData.likesGoldrush,
        platformSuggestions: formData.platformSuggestions
      },
      additionalNotes: formData.notes
    };
  }

  /**
   * Transform customer visit form data
   */
  static transformCustomerVisitData(formData: Record<string, unknown>): Record<string, unknown> {
    return {
      industry: {
        industry: formData.industry,
        category: formData.category,
        selectedBrandId: formData.selectedBrandId,
        selectedCategoryId: formData.selectedCategoryId,
        selectedProductId: formData.selectedProductId
      },
      awareness: {
        knowsBrand: formData.knowsBrand === 'yes',
        stocksProduct: formData.stocksProduct === 'yes',
        currentSales: formData.currentSales,
        stockSource: formData.stockSource
      },
      competitors: {
        competitorsInStore: formData.competitorsInStore,
        competitorStockSource: formData.competitorStockSource,
        competitorProducts: formData.competitorProducts,
        competitorPrices: formData.competitorPrices
      },
      advertising: {
        hasOurAdverts: formData.hasOurAdverts === 'yes',
        otherAdvertBrands: formData.otherAdvertBrands,
        putUpOurBoard: formData.putUpOurBoard === 'yes'
      },
      goldrushId: formData.goldrushId,
      notes: formData.notes
    };
  }
}
