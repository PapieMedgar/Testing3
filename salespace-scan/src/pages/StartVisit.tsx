import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Store, AlertCircle, Plus, Loader2, Search, Building2, User, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { shopsAPI, agentAPI } from "@/lib/api";
import { brandAPI, Brand } from "@/lib/brandAPI";

import type { Shop } from "@/lib/api";

const StartVisit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // State for the form
  const [visitType, setVisitType] = useState<"existing" | "new">("existing");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopSearch, setShopSearch] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [newShopAddress, setNewShopAddress] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for existing shops and location
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showShopSelection, setShowShopSelection] = useState(false);

  // Load existing shops, brands, and get location (optional)
  useEffect(() => {
    const loadShops = async () => {
      try {
        const shopsList = await shopsAPI.getAll();
        setShops(shopsList);
        setFilteredShops(shopsList);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load shops. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingShops(false);
      }
    };
    
    const loadBrands = async () => {
      try {
        const brandsList = await brandAPI.getAllBrands();
        setBrands(brandsList);
      } catch (error) {
        console.error("Error loading brands:", error);
        // Error toast removed as requested
      } finally {
        setIsLoadingBrands(false);
      }
    };

    loadShops();
    loadBrands();

    // Get user's location (optional - primarily for shop visits)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Location not required for individual visits, so just log the error
          setIsLoadingLocation(false);
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
    }
  }, [toast]);

  // Filter shops based on search term
  useEffect(() => {
    const filtered = shops.filter(shop =>
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredShops(filtered);
  }, [searchTerm, shops]);
  
  // Load categories when a brand is selected
  useEffect(() => {
    if (!selectedBrandId) {
      setCategories([]);
      setSelectedCategoryId("");
      return;
    }
    
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categoriesData = await brandAPI.getBrandCategories(parseInt(selectedBrandId));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, [selectedBrandId, toast]);
  
  // Load products when a category is selected
  useEffect(() => {
    if (!selectedCategoryId) {
      setProducts([]);
      setSelectedProductId("");
      return;
    }
    
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const productsData = await brandAPI.getCategoryProducts(parseInt(selectedCategoryId));
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, [selectedCategoryId, toast]);

  const handleSelectShop = (shop: Shop | null, visitType: 'individual' | 'customer') => {
    // For shop/customer visits, location is mandatory
    if (visitType === 'customer' && !location) {
      toast({
        title: "Error",
        description: "Location is required for shop visits.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if brand is selected
    if (!selectedBrandId) {
      toast({
        title: "Error",
        description: "Please select a brand for this visit.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if category is selected
    if (!selectedCategoryId) {
      toast({
        title: "Error",
        description: "Please select a category for this visit.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if product is selected
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product for this visit.",
        variant: "destructive",
      });
      return;
    }

    // For individual visits, location is optional
    if (visitType === 'individual') {
      navigate(`/visit/individual`, {
        state: {
          location, // This might be null, which is fine for individual visits
          isNewShop: false,
          brandId: parseInt(selectedBrandId),
          categoryId: parseInt(selectedCategoryId),
          productId: parseInt(selectedProductId)
        }
      });
      return;
    }

    // For customer visits, require shop information
    if (!shop) {
      toast({
        title: "Error",
        description: "Please select a shop for customer visits.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to the customer visit form with shop, brand, category, product, and location data
    navigate(`/visit/${visitType}`, {
      state: {
        shop,
        location,
        isNewShop: false,
        brandId: parseInt(selectedBrandId),
        categoryId: parseInt(selectedCategoryId),
        productId: parseInt(selectedProductId)
      }
    });
  };

  const handleCreateNewShop = (visitType: 'individual' | 'customer') => {
    // For shop/customer visits, location is mandatory
    if (visitType === 'customer' && !location) {
      toast({
        title: "Error",
        description: "Location is required for shop visits.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if brand is selected
    if (!selectedBrandId) {
      toast({
        title: "Error",
        description: "Please select a brand for this visit.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if category is selected
    if (!selectedCategoryId) {
      toast({
        title: "Error",
        description: "Please select a category for this visit.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if product is selected
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product for this visit.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to new shop creation with visit type, brand, category, and product
    // Location is optional for individual visits
    navigate(`/visit/new-shop`, {
      state: {
        visitType,
        location, // This might be null for individual visits
        brandId: parseInt(selectedBrandId),
        categoryId: parseInt(selectedCategoryId),
        productId: parseInt(selectedProductId)
      }
    });
  };

  // Don't block UI while loading location since it's now optional
  if (isLoadingShops || isLoadingBrands) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Start a Visit</h1>
        <p className="text-muted-foreground">
          Choose your visit type to begin.
        </p>
      </div>

      {/* Location Status */}
      {/* Location Status */}
      {location ? (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">
              Location acquired: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              {isLoadingLocation 
                ? "Getting your location..." 
                : "Location not available - required for shop visits, optional for individual visits"
              }
            </span>
          </div>
        </div>
      )}

      {/* Visit Type Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Visit Type</CardTitle>
          <CardDescription>Choose the type of visit you want to start</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={() => handleSelectShop(null, 'individual')}
              className="flex-1 h-20 flex-col"
              variant="outline"
            >
              <User className="w-8 h-8 mb-2" />
              Individual Visit
            </Button>
            <Button
              onClick={() => setShowShopSelection(true)}
              className="flex-1 h-20 flex-col"
              variant="outline"
            >
              <Building2 className="w-8 h-8 mb-2" />
              Shop Visit
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Brand, Category, and Product Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Product Selection</CardTitle>
          <CardDescription>Select the brand, category, and product for this visit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brand Selection */}
          <div>
            <Label htmlFor="brandSelect">Select Brand</Label>
            {isLoadingBrands ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : brands.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Package className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No brands available</p>
              </div>
            ) : (
              <Select
                value={selectedBrandId}
                onValueChange={(value) => {
                  setSelectedBrandId(value);
                  setSelectedCategoryId("");
                  setSelectedProductId("");
                }}
              >
                <SelectTrigger id="brandSelect">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Category Selection - Only show if brand is selected */}
          {selectedBrandId && (
            <div>
              <Label htmlFor="categorySelect">Select Category</Label>
              <Select 
                value={selectedCategoryId} 
                onValueChange={(value) => {
                  setSelectedCategoryId(value);
                  setSelectedProductId("");
                }}
                disabled={isLoadingCategories}
              >
                <SelectTrigger id="categorySelect" className={isLoadingCategories ? "opacity-70" : ""}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="none" disabled>No categories available</SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Product Selection - Only show if category is selected */}
          {selectedCategoryId && (
            <div>
              <Label htmlFor="productSelect">Select Product</Label>
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
                disabled={isLoadingProducts}
              >
                <SelectTrigger id="productSelect" className={isLoadingProducts ? "opacity-70" : ""}>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProducts ? (
                    <SelectItem value="loading" disabled>Loading products...</SelectItem>
                  ) : products.length === 0 ? (
                    <SelectItem value="none" disabled>No products available</SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {showShopSelection && (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search for shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* New Shop Option */}
          <Card className="mb-6 border-dashed border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Shop Not Listed?
              </CardTitle>
              <CardDescription>
                Create a new shop if you can't find it in the list below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleCreateNewShop('customer')}
                className="w-full"
                variant="outline"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Create New Shop
              </Button>
            </CardContent>
          </Card>

          {/* Existing Shops */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Existing Shops</h2>
            {isLoadingShops ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
                  <p className="text-muted-foreground">Loading shops...</p>
                </CardContent>
              </Card>
            ) : filteredShops.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No shops found matching your search.' : 'No shops available.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredShops.map((shop) => (
                <Card key={shop.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{shop.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {shop.address}
                        </p>
                      </div>
                      <div>
                        <Button
                          onClick={() => handleSelectShop(shop, 'customer')}
                          variant="outline"
                          size="sm"
                        >
                          Select Shop
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StartVisit;
