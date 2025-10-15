import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitService } from '@/lib/visitService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Camera, Save, MapPin, Building2, FileText, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { brandAPI } from '@/lib/api';
import { Brand, Category, Product } from '@/types';

const customerVisitSchema = z.object({
  // Brand data is now passed from StartVisit page
  industry: z.string().optional(),
  category: z.string().optional(),
  selectedBrandId: z.number().nullable().optional(),
  selectedCategoryId: z.number().nullable().optional(),
  selectedProductId: z.number().nullable().optional(),
  
  // Awareness
  knowsBrand: z.enum(['yes', 'no'], { required_error: 'Please select if customer knows the brand' }),
  stocksProduct: z.enum(['yes', 'no'], { required_error: 'Please select if customer stocks the product' }),
  currentSales: z.string().optional(),
  stockSource: z.enum(['wholesaler', 'manufacturer', 'other'], { required_error: 'Please select stock source' }),
  
  // Competitor Information
  competitorsInStore: z.string().optional(),
  competitorStockSource: z.enum(['wholesaler', 'manufacturer', 'other']).optional(),
  competitorProducts: z.string().optional(),
  competitorPrices: z.string().optional(),
  
  // Advertising
  hasOurAdverts: z.enum(['yes', 'no'], { required_error: 'Please select if there are adverts for this brand' }),
  otherAdvertBrands: z.string().optional(),
  putUpOurBoard: z.enum(['yes', 'no'], { required_error: 'Please select if our board was put up' }),
  
  // Training
  // trainedCashier: z.enum(['yes', 'no'], { required_error: 'Please select if cashier was trained' }),
  
  // Additional Notes
  goldrushId: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerVisitFormData = z.infer<typeof customerVisitSchema>;

const CustomerVisit: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outsidePhoto, setOutsidePhoto] = useState<File | null>(null);
  const [competitorPhotos, setCompetitorPhotos] = useState<File[]>([]);
  const [boardPhoto, setBoardPhoto] = useState<File | null>(null);
  
  // Brand-Category-Product states
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const { shop, location: currentLocation, isNewShop, brandId, categoryId, productId } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CustomerVisitFormData>({
    resolver: zodResolver(customerVisitSchema),
    onChange: (data) => {
      console.log('Form data changed:', data);
    },
    onError: (errors) => {
      console.log('Form validation errors:', errors);
      toast.error('Please fill all required fields correctly.');
    }
  });

  const watchStocksProduct = watch('stocksProduct');
  const watchKnowsBrand = watch('knowsBrand');
  const watchPutUpBoard = watch('putUpOurBoard');
  
  // Load brands on component mount
  useEffect(() => {
    const loadBrands = async () => {
      setIsLoadingBrands(true);
      try {
  const brandsData = await brandAPI.getBrands();
        setBrands(brandsData);
        
        // If brandId is provided in location state, select it
        if (brandId) {
          setSelectedBrandId(brandId);
        }
      } catch (error) {
        console.error('Failed to load brands:', error);
        // Error toast removed as requested
      } finally {
        setIsLoadingBrands(false);
      }
    };
    
    loadBrands();
  }, [brandId]);
  
  // Set category and product IDs from location state if provided
  useEffect(() => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
    
    if (productId) {
      setSelectedProductId(productId);
    }
  }, [categoryId, productId]);
  
  // Load categories when a brand is selected
  useEffect(() => {
    if (!selectedBrandId) {
      setCategories([]);
      setSelectedCategoryId(null);
      return;
    }
    
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
  const categoriesData = await brandAPI.getCategories(selectedBrandId);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, [selectedBrandId]);
  
  // Load products when a category is selected
  useEffect(() => {
    if (!selectedCategoryId) {
      setProducts([]);
      setSelectedProductId(null);
      return;
    }
    
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
  const productsData = await brandAPI.getProducts(selectedCategoryId);
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, [selectedCategoryId]);

  const handlePhotoCapture = (type: 'outside' | 'competitor' | 'board') => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        switch (type) {
          case 'outside':
            setOutsidePhoto(file);
            toast.success('Outside photo captured');
            break;
          case 'competitor':
            setCompetitorPhotos(prev => [...prev, file]);
            toast.success('Competitor photo captured');
            break;
          case 'board':
            setBoardPhoto(file);
            toast.success('Board photo captured');
            break;
        }
      }
    };
  };

  // Safety mechanism to ensure navigation happens even if there's an error
  useEffect(() => {
    let navigateTimer: number | null = null;
    
    if (isSubmitting) {
      // Set a backup navigation timeout in case something goes wrong
      navigateTimer = window.setTimeout(() => {
        console.log('Safety timeout triggered - navigating to /visits');
        navigate('/visits');
      }, 10000); // 10 seconds safety timeout
    }
    
    return () => {
      // Clear the timer when component unmounts or isSubmitting changes
      if (navigateTimer) {
        window.clearTimeout(navigateTimer);
      }
    };
  }, [isSubmitting, navigate]);
  
  const onSubmit = async (data: CustomerVisitFormData) => {
    console.log('Submit clicked - Form Data:', data);
    
    if (!shop || !currentLocation) {
      console.error('Missing shop or location data');
      toast.error('Shop and location data are required');
      return;
    }

    if (!outsidePhoto) {
      console.error('Outside photo is required');
      toast.error('Please take a photo of the outside');
      return;
    }

    if (data.putUpOurBoard === 'yes' && !boardPhoto) {
      console.error('Board photo is required when board was put up');
      toast.error('Please take a photo of the board');
      return;
    }

    setIsSubmitting(true);
    console.log('Starting submission process...');

    try {
      console.log('Transforming form data...');
      const responses = VisitService.transformCustomerVisitData(data);
      console.log('Transformed responses:', responses);

      // Collect all photos in the correct order
      const photos = [];
      if (outsidePhoto) {
        console.log('Adding outside photo:', outsidePhoto.name);
        photos.push(outsidePhoto);
      }
      if (competitorPhotos.length > 0) {
        console.log('Adding competitor photos:', competitorPhotos.map(p => p.name));
        photos.push(...competitorPhotos);
      }
      if (boardPhoto) {
        console.log('Adding board photo:', boardPhoto.name);
        photos.push(boardPhoto);
      }

      console.log('Creating visit with photos count:', photos.length);
      console.log('Brand, Category, Product IDs:', {
        brandId: selectedBrandId,
        categoryId: selectedCategoryId,
        productId: selectedProductId
      });
      
      // Explicitly log each parameter being sent to createVisit
      const visitParams = {
        shop: shop,
        location: currentLocation,
        visitType: 'customer' as const, // Use 'as const' to specify exact string type
        brandId: selectedBrandId || undefined, // Ensure null becomes undefined
        categoryId: selectedCategoryId || undefined,
        productId: selectedProductId || undefined,
        responses: responses,
        photos: photos,
        notes: data.notes
      };
      
      console.log('Complete visit parameters:', JSON.stringify(visitParams, (key, value) => {
        if (key === 'photos') {
          return `${value.length} photos`;
        }
        return value;
      }, 2));
      
      // Create visit with checkin and visit response using VisitService
      const result = await VisitService.createVisit(visitParams);

      console.log('Visit created successfully:', result);
      toast.success('Customer visit completed successfully!');
      
      // Set a small timeout to ensure the toast is visible before redirecting
      console.log('Redirecting to /visits in 1 second...');
      setTimeout(() => {
        console.log('Executing navigation to /visits');
        navigate('/visits');
      }, 1000);
    } catch (error) {
      console.error('Failed to save visit:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        toast.error(`Failed to save visit: ${error.message}`);
      } else {
        console.error('Unknown error type:', error);
        toast.error('Failed to save visit. Please try again.');
      }
      
      // Even if there's an error, try to navigate back to visits after 3 seconds
      // This ensures users don't get stuck on the form
      console.log('Will attempt to navigate to /visits after error in 3 seconds');
      setTimeout(() => {
        console.log('Executing navigation to /visits after error');
        navigate('/visits');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shop || !currentLocation) {
    navigate('/start-visit');
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/start-visit')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop Selection
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Customer Visit Survey</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{shop.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span>Customer Business</span>
          </div>
        </div>
      </div>

      <form 
        onSubmit={(e) => {
          console.log('Form submit event triggered');
          handleSubmit((data) => {
            console.log('Form is valid, calling onSubmit with data:', data);
            onSubmit(data);
          })(e);
        }} 
        className="space-y-6">
        {/* Awareness */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Awareness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Do you know about our brand? *</Label>
              <RadioGroup
                value={watch('knowsBrand')}
                onValueChange={(value) => setValue('knowsBrand', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="knows-yes" />
                  <Label htmlFor="knows-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="knows-no" />
                  <Label htmlFor="knows-no">No</Label>
                </div>
              </RadioGroup>
              {errors.knowsBrand && (
                <p className="text-red-500 text-sm mt-1">{errors.knowsBrand.message}</p>
              )}
            </div>

            <div>
              <Label>Do you stock our product? *</Label>
              <RadioGroup
                value={watch('stocksProduct')}
                onValueChange={(value) => setValue('stocksProduct', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="stocks-yes" />
                  <Label htmlFor="stocks-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="stocks-no" />
                  <Label htmlFor="stocks-no">No</Label>
                </div>
              </RadioGroup>
              {errors.stocksProduct && (
                <p className="text-red-500 text-sm mt-1">{errors.stocksProduct.message}</p>
              )}
            </div>

            {watchStocksProduct === 'yes' && (
              <>
                <div>
                  <Label htmlFor="currentSales">What are your current sales?</Label>
                  <Input
                    id="currentSales"
                    {...register('currentSales')}
                    placeholder="e.g., R5000 per month"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label>How do you get your stock? *</Label>
                  <Select 
                    value={watch('stockSource')}
                    onValueChange={(value) => setValue('stockSource', value as 'wholesaler' | 'manufacturer' | 'other')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wholesaler">From Wholesaler</SelectItem>
                      <SelectItem value="manufacturer">From Manufacturer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.stockSource && (
                    <p className="text-red-500 text-sm mt-1">{errors.stockSource.message}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Competitor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Competitor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="competitorsInStore">Who else is in the store? (Competitors)</Label>
              <Textarea
                id="competitorsInStore"
                {...register('competitorsInStore')}
                placeholder="List competitor brands/products in store"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div>
              <Label>How do you get competitor stock?</Label>
              <Select 
                value={watch('competitorStockSource')}
                onValueChange={(value) => setValue('competitorStockSource', value as 'wholesaler' | 'manufacturer' | 'other')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select competitor stock source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wholesaler">From Wholesaler</SelectItem>
                  <SelectItem value="manufacturer">From Manufacturer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="competitorProducts">What products do they offer?</Label>
                <Textarea
                  id="competitorProducts"
                  {...register('competitorProducts')}
                  placeholder="List competitor products"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="competitorPrices">What are their prices?</Label>
                <Textarea
                  id="competitorPrices"
                  {...register('competitorPrices')}
                  placeholder="List competitor prices"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label>Take pictures of competitor products</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture('competitor')}
                  style={{ display: 'none' }}
                  id="competitorPhotoInput"
                  multiple
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('competitorPhotoInput')?.click()}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Competitor Photos ({competitorPhotos.length} captured)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advertising */}
        <Card>
          <CardHeader>
            <CardTitle>Advertising</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Are there adverts for this brand? *</Label>
              <RadioGroup
                value={watch('hasOurAdverts')}
                onValueChange={(value) => setValue('hasOurAdverts', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="adverts-yes" />
                  <Label htmlFor="adverts-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="adverts-no" />
                  <Label htmlFor="adverts-no">No</Label>
                </div>
              </RadioGroup>
              {errors.hasOurAdverts && (
                <p className="text-red-500 text-sm mt-1">{errors.hasOurAdverts.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="otherAdvertBrands">What other advert boards are there? (Brands)</Label>
              <Textarea
                id="otherAdvertBrands"
                {...register('otherAdvertBrands')}
                placeholder="List other advertising brands visible"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div>
              <Label>Take a picture of outside *</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture('outside')}
                  style={{ display: 'none' }}
                  id="outsidePhotoInput"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('outsidePhotoInput')?.click()}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {outsidePhoto ? 'Outside Photo Captured ✓' : 'Take Outside Photo'}
                </Button>
              </div>
            </div>

            <div>
              <Label>Did you put up our board? *</Label>
              <RadioGroup
                value={watch('putUpOurBoard')}
                onValueChange={(value) => setValue('putUpOurBoard', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="board-yes" />
                  <Label htmlFor="board-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="board-no" />
                  <Label htmlFor="board-no">No</Label>
                </div>
              </RadioGroup>
              {errors.putUpOurBoard && (
                <p className="text-red-500 text-sm mt-1">{errors.putUpOurBoard.message}</p>
              )}
            </div>

            {watchPutUpBoard === 'yes' && (
              <div>
                <Label>Take a picture of the board*</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture('board')}
                    style={{ display: 'none' }}
                    id="boardPhotoInput"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('boardPhotoInput')?.click()}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {boardPhoto ? 'Board Photo Captured ✓' : 'Take Board Photo'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Did you train the cashier? *</Label>
              <RadioGroup
                onValueChange={(value) => setValue('trainedCashier', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="trained-yes" />
                  <Label htmlFor="trained-yes">Yes (Infographic loaded for brands)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="trained-no" />
                  <Label htmlFor="trained-no">No</Label>
                </div>
              </RadioGroup>
              {errors.trainedCashier && (
                <p className="text-red-500 text-sm mt-1">{errors.trainedCashier.message}</p>
              )}
            </div>
          </CardContent>
        </Card> */}

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="goldrushId">Goldrush ID</Label>
              <Input
                id="goldrushId"
                {...register('goldrushId')}
                placeholder="Enter Goldrush ID (optional)"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional notes about this visit"
                disabled={isSubmitting}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/start-visit')}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Complete Visit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerVisit;
