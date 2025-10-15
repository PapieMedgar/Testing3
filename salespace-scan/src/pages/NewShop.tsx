import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { agentAPI, shopsAPI } from '@/lib/api';

const newShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required'),
  address: z.string().min(1, 'Address is required'),
  contactPerson: z.string().optional(),
  phoneNumber: z.string().optional(),
  notes: z.string().optional(),
});

type NewShopFormData = z.infer<typeof newShopSchema>;

const NewShop: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { visitType, location: currentLocation, brandId } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<NewShopFormData>({
    resolver: zodResolver(newShopSchema)
  });

  const onSubmit = async (data: NewShopFormData) => {
    setIsSubmitting(true);
    try {
      // First create the shop using agent shops API
      const shop = await shopsAPI.create({
        name: data.name,
        address: data.address,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng
      });

      // Create a placeholder photo for the check-in
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(`New Shop: ${data.name}`, 20, 40);
        ctx.fillText(`Location: ${currentLocation.lat}, ${currentLocation.lng}`, 20, 70);
        ctx.fillText(`Address: ${data.address}`, 20, 100);
        ctx.fillText(`Created on: ${new Date().toLocaleString()}`, 20, 130);
      }

      // Convert canvas to blob and then to File
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95));
      const photo = new File([blob], 'shop_creation.jpg', { type: 'image/jpeg', lastModified: Date.now() });

      // Now create the check-in for the newly created shop
      const result = await agentAPI.createVisit({
        shop_id: shop.id,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        notes: data.notes || '',
        photo,
        brand_id: brandId
      });

      toast.success('Shop created successfully!');

      // Navigate to visit page with the new check-in data
      navigate(`/visit/${visitType}`, {
        state: {
          shop,
          location: currentLocation,
          checkInId: result.id,
          isNewShop: true,
          brandId: brandId
        }
      });
    } catch (error) {
      console.error('Failed to create shop:', error);
      toast.error('Failed to create shop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visitType || !currentLocation) {
    navigate('/start-visit');
    return null;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/start-visit')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop Selection
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Create New Shop</h1>
        <p className="text-muted-foreground">
          Add shop details before starting your {visitType} visit.
        </p>
      </div>

      {/* Location Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter shop name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Enter full address"
                disabled={isSubmitting}
                rows={3}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                {...register('contactPerson')}
                placeholder="Name of contact person"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...register('phoneNumber')}
                placeholder="Shop phone number"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about the shop"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

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
                  <>Creating...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create & Start Visit
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewShop;
