import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Camera, Save, MapPin, User, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { VisitService, type VisitData } from '@/lib/visitService';

const individualVisitSchema = z.object({
  // Brand Information
  brandInfoGiven: z.enum(['yes', 'no'], { required_error: 'Please select if brand information was given' }),
  
  // Consumer Details
  consumerName: z.string().min(1, 'Consumer name is required'),
  consumerSurname: z.string().min(1, 'Consumer surname is required'),
  idPassportNumber: z.string().min(1, 'ID/Passport number is required'),
  cellphoneNumber: z.string().min(10, 'Valid cellphone number is required'),
  goldrushId: z.string().min(1, 'Goldrush ID is required'),
  
  // Conversion
  converted: z.enum(['yes', 'no'], { required_error: 'Please select if consumer converted' }),
  
  // Betting Information
  isBettingSomewhere: z.enum(['yes', 'no'], { required_error: 'Please select if consumer is betting somewhere' }),
  currentBettingCompany: z.string().optional(),
  usedGoldrushBefore: z.enum(['yes', 'no'], { required_error: 'Please select if consumer used Goldrush before' }),
  goldrushComparison: z.string().optional(),
  likesGoldrush: z.enum(['yes', 'no'], { required_error: 'Please select if consumer likes Goldrush' }),
  platformSuggestions: z.string().optional(),
  
  // Additional Notes
  notes: z.string().optional(),
});

type IndividualVisitFormData = z.infer<typeof individualVisitSchema>;

const IndividualVisit: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const { shop, location: currentLocation, isNewShop, brandId, categoryId, productId } = location.state || {};

  // Use manual location if available, otherwise fallback to currentLocation
  const effectiveLocation = manualLocation || currentLocation;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<IndividualVisitFormData>({
    resolver: zodResolver(individualVisitSchema)
  });

  const watchIsBetting = watch('isBettingSomewhere');
  const watchUsedGoldrush = watch('usedGoldrushBefore');

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIdPhoto(file);
      toast.success('ID/Passport photo captured');
    }
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setManualLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
          toast.success('Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
          toast.error('Failed to get location. Please try again.');
        }
      );
    } else {
      setIsGettingLocation(false);
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const onSubmit = async (data: IndividualVisitFormData) => {
    console.log('onSubmit called', data);

    setIsSubmitting(true);
    try {
      // Transform form data to the expected API format
      const responses = VisitService.transformIndividualVisitData(data);

      // Create visit with checkin and visit response
      // Location is optional for individual visits
      const visitData: VisitData = {
        location: effectiveLocation || null, // Use effective location (manual or original)
        visitType: 'individual',
        responses: responses,
        notes: data.notes,
        brandId: brandId,
        categoryId: categoryId,
        productId: productId
      };

      // Add photos only if captured
      if (idPhoto) {
        visitData.photos = [idPhoto];
      }

      const result = await VisitService.createVisit(visitData);

      console.log('Visit created successfully:', result);
      toast.success('Individual visit completed successfully!');
      navigate('/visits');
    } catch (error) {
      console.error('Failed to save visit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save visit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Location is optional for individual visits, so don't redirect if missing
  // if (!currentLocation) {
  //   navigate('/start-visit');
  //   return null;
  // }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/start-visit')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Visit Selection
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Individual Visit</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>Individual Consumer</span>
          </div>
          {effectiveLocation ? (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Location: {effectiveLocation.lat.toFixed(4)}, {effectiveLocation.lng.toFixed(4)}</span>
              {manualLocation && <span className="text-green-600 text-xs">(manually captured)</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-yellow-600">
                <MapPin className="w-4 h-4" />
                <span>Location: Not captured (optional)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="text-xs"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Getting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3 mr-1" />
                    Get Location
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Brand Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Brand Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Did you give brand information? *</Label>
              <RadioGroup
                onValueChange={(value) => setValue('brandInfoGiven', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="brand-yes" />
                  <Label htmlFor="brand-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="brand-no" />
                  <Label htmlFor="brand-no">No</Label>
                </div>
              </RadioGroup>
              {errors.brandInfoGiven && (
                <p className="text-red-500 text-sm mt-1">{errors.brandInfoGiven.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consumer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Consumer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consumerName">Name *</Label>
                <Input
                  id="consumerName"
                  {...register('consumerName')}
                  placeholder="Consumer's first name"
                  disabled={isSubmitting}
                />
                {errors.consumerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.consumerName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="consumerSurname">Surname *</Label>
                <Input
                  id="consumerSurname"
                  {...register('consumerSurname')}
                  placeholder="Consumer's surname"
                  disabled={isSubmitting}
                />
                {errors.consumerSurname && (
                  <p className="text-red-500 text-sm mt-1">{errors.consumerSurname.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="idPassportNumber">ID/Passport Number *</Label>
              <Input
                id="idPassportNumber"
                {...register('idPassportNumber')}
                placeholder="Enter ID or Passport number"
                disabled={isSubmitting}
              />
              {errors.idPassportNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.idPassportNumber.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="idPhoto">ID/Passport Photo (Optional)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                  id="idPhotoInput"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('idPhotoInput')?.click()}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {idPhoto ? 'Photo Captured ✓' : 'Take Photo of ID/Passport (Optional)'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="cellphoneNumber">Cellphone Number *</Label>
              <Input
                id="cellphoneNumber"
                type="tel"
                {...register('cellphoneNumber')}
                placeholder="Consumer's cellphone number"
                disabled={isSubmitting}
              />
              {errors.cellphoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cellphoneNumber.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="goldrushId">Goldrush ID *</Label>
              <Input
                id="goldrushId"
                {...register('goldrushId')}
                placeholder="Enter Goldrush ID"
                disabled={isSubmitting}
              />
              {errors.goldrushId && (
                <p className="text-red-500 text-sm mt-1">{errors.goldrushId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Did the consumer convert (buy first voucher)? *</Label>
              <RadioGroup
                onValueChange={(value) => setValue('converted', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="convert-yes" />
                  <Label htmlFor="convert-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="convert-no" />
                  <Label htmlFor="convert-no">No</Label>
                </div>
              </RadioGroup>
              {errors.converted && (
                <p className="text-red-500 text-sm mt-1">{errors.converted.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Betting Information */}
        <Card>
          <CardHeader>
            <CardTitle>Betting Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Are you betting somewhere? *</Label>
              <RadioGroup
                onValueChange={(value) => setValue('isBettingSomewhere', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="betting-yes" />
                  <Label htmlFor="betting-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="betting-no" />
                  <Label htmlFor="betting-no">No</Label>
                </div>
              </RadioGroup>
              {errors.isBettingSomewhere && (
                <p className="text-red-500 text-sm mt-1">{errors.isBettingSomewhere.message}</p>
              )}
            </div>

            {watchIsBetting === 'yes' && (
              <div>
                <Label htmlFor="currentBettingCompany">What company do you use?</Label>
                <Input
                  id="currentBettingCompany"
                  {...register('currentBettingCompany')}
                  placeholder="Current betting company"
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div>
              <Label>Did you use Goldrush before? *</Label>
              <RadioGroup
                onValueChange={(value) => setValue('usedGoldrushBefore', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="goldrush-yes" />
                  <Label htmlFor="goldrush-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="goldrush-no" />
                  <Label htmlFor="goldrush-no">No</Label>
                </div>
              </RadioGroup>
              {errors.usedGoldrushBefore && (
                <p className="text-red-500 text-sm mt-1">{errors.usedGoldrushBefore.message}</p>
              )}
            </div>

            {watchUsedGoldrush === 'yes' && (
              <div>
                <Label htmlFor="goldrushComparison">How does it compare to other betting companies?</Label>
                <Textarea
                  id="goldrushComparison"
                  {...register('goldrushComparison')}
                  placeholder="Consumer's comparison feedback"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label>Do you like Goldrush? *</Label>
              <RadioGroup
                onValueChange={(value) => setValue('likesGoldrush', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="likes-yes" />
                  <Label htmlFor="likes-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="likes-no" />
                  <Label htmlFor="likes-no">No</Label>
                </div>
              </RadioGroup>
              {errors.likesGoldrush && (
                <p className="text-red-500 text-sm mt-1">{errors.likesGoldrush.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="platformSuggestions">What would you like the platform to do?</Label>
              <Textarea
                id="platformSuggestions"
                {...register('platformSuggestions')}
                placeholder="Consumer's suggestions for platform improvements"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
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

export default IndividualVisit;
