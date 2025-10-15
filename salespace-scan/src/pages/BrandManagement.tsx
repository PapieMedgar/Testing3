import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Search, 
  Upload, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { brandAPI, Brand } from "@/lib/brandAPI";
import { API_BASE_URL } from "@/lib/api";

const BrandManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for brands
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // State for brand dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  
  // Form state
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Category state
  const [categories, setCategories] = useState<Array<{
    id?: number;
    name: string;
    description: string;
    products: Array<{
      id?: number;
      name: string;
      description: string;
    }>;
  }>>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  
  // Product state
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  
  // Load brands on component mount
  useEffect(() => {
    loadBrands();
  }, []);
  
  // Filter brands based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredBrands(filtered);
    }
  }, [searchTerm, brands]);
  
  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const data = await brandAPI.getAllBrands();
      setBrands(data);
      setFilteredBrands(data);
    } catch (error) {
      console.error("Failed to load brands:", error);
      // Error toast removed as requested
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateBrand = async () => {
    if (!brandName.trim()) {
      toast({
        title: "Error",
        description: "Brand name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Prepare categories data if any
      const categoriesData = categories.length > 0 
        ? categories.map(cat => ({
            name: cat.name,
            description: cat.description,
            products: cat.products.map(prod => ({
              name: prod.name,
              description: prod.description
            }))
          }))
        : undefined;
      
      // Create brand with categories
      const newBrand = await brandAPI.createBrand({
        name: brandName,
        description: brandDescription,
        categories: categoriesData
      });
      
      toast({
        title: "Success",
        description: `Brand "${brandName}" created successfully with ${categories.length} categories.`,
      });
      
      // Reset form and close dialog
      resetForm();
      setIsCreateDialogOpen(false);
      
      // Reload brands
      loadBrands();
    } catch (error) {
      console.error("Failed to create brand:", error);
      toast({
        title: "Error",
        description: "Failed to create brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateBrand = async () => {
    if (!selectedBrand) return;
    
    if (!brandName.trim()) {
      toast({
        title: "Error",
        description: "Brand name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Prepare categories data
      const categoriesData = categories.map(cat => ({
        id: cat.id && cat.id > 0 ? cat.id : undefined,
        name: cat.name,
        description: cat.description,
        products: cat.products.map(prod => ({
          id: prod.id && prod.id > 0 ? prod.id : undefined,
          name: prod.name,
          description: prod.description
        }))
      }));
      
      // Update brand with all categories and products in a single API call
      console.log("Updating brand with data:", {
        name: brandName,
        description: brandDescription,
        categories: categoriesData
      });
      
      await brandAPI.updateBrand(selectedBrand.id, {
        name: brandName,
        description: brandDescription,
        categories: categoriesData
      });
      
      toast({
        title: "Success",
        description: "Brand and its products updated successfully.",
      });
      
      // Reset form and close dialog
      resetForm();
      setIsEditDialogOpen(false);
      
      // Reload brands
      loadBrands();
    } catch (error) {
      console.error("Failed to update brand:", error);
      toast({
        title: "Error",
        description: "Failed to update brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;
    
    setIsSubmitting(true);
    try {
      console.log(`Attempting to delete brand with ID: ${selectedBrand.id}`);
      
      // First, delete all products associated with this brand
      try {
        const brandProducts = await brandAPI.getBrandProducts(selectedBrand.id);
        console.log(`Found ${brandProducts.length} products to delete`);
        
        for (const product of brandProducts) {
          console.log(`Deleting product: ${product.id}`);
          await brandAPI.deleteProduct(product.id);
        }
      } catch (productError) {
        console.error("Error deleting products:", productError);
      }
      
      // Then, delete all categories associated with this brand
      try {
        const brandCategories = await brandAPI.getBrandCategories(selectedBrand.id);
        console.log(`Found ${brandCategories.length} categories to delete`);
        
        for (const category of brandCategories) {
          console.log(`Deleting category: ${category.id}`);
          await brandAPI.deleteCategory(category.id);
        }
      } catch (categoryError) {
        console.error("Error deleting categories:", categoryError);
      }
      
      // Finally, delete the brand
      await brandAPI.deleteBrand(selectedBrand.id);
      
      toast({
        title: "Success",
        description: "Brand and all associated products deleted successfully.",
      });
      
      // Reset form and close dialog
      resetForm();
      setIsDeleteDialogOpen(false);
      
      // Reload brands
      loadBrands();
    } catch (error) {
      console.error("Failed to delete brand:", error);
      toast({
        title: "Error",
        description: "Failed to delete brand. Please ensure all products and categories are removed first.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  
  const openEditDialog = async (brand: Brand) => {
    setSelectedBrand(brand);
    setBrandName(brand.name);
    setBrandDescription(brand.description || "");
    
    // Fetch brand categories and products
    try {
      const brandCategories = await brandAPI.getBrandCategories(brand.id);
      
      // Transform the categories to match our state format
      const formattedCategories = await Promise.all(
        brandCategories.map(async (category) => {
          // Fetch products for this category
          const products = await brandAPI.getCategoryProducts(category.id);
          
          return {
            id: category.id,
            name: category.name,
            description: category.description || "",
            products: products.map(product => ({
              id: product.id,
              name: product.name,
              description: product.description || ""
            }))
          };
        })
      );
      
      setCategories(formattedCategories);
    } catch (error) {
      console.error("Failed to fetch brand details:", error);
      toast({
        title: "Error",
        description: "Failed to load brand details. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteDialogOpen(true);
  };
  
  const resetForm = () => {
    setBrandName("");
    setBrandDescription("");
    setSelectedBrand(null);
    setCategories([]);
    setShowCategoryForm(false);
    setCategoryName("");
    setCategoryDescription("");
    setShowProductForm(false);
    setSelectedCategoryIndex(null);
    setProductName("");
    setProductDescription("");
  };
  
  const navigateToProducts = async (brand: Brand) => {
    setSelectedBrand(brand);
    setBrandName(brand.name);
    setBrandDescription(brand.description || "");
    
    // Show loading toast
    toast({
      title: "Loading Products",
      description: "Fetching products for " + brand.name,
    });
    
    try {
      // First, get all products directly associated with the brand
      const brandProducts = await brandAPI.getBrandProducts(brand.id);
      console.log(`Loaded ${brandProducts.length} products directly under brand`);
      
      // Then get categories and their products
      const brandCategories = await brandAPI.getBrandCategories(brand.id);
      console.log(`Loaded ${brandCategories.length} categories`);
      
      // Transform the categories to match our state format
      const formattedCategories = await Promise.all(
        brandCategories.map(async (category) => {
          // Fetch products for this category
          const products = await brandAPI.getCategoryProducts(category.id);
          console.log(`Category ${category.name} has ${products.length} products`);
          
          return {
            id: category.id,
            name: category.name,
            description: category.description || "",
            products: products.map(product => ({
              id: product.id,
              name: product.name,
              description: product.description || ""
            }))
          };
        })
      );
      
      // If there are uncategorized products, create a special "Uncategorized" category
      if (brandProducts.length > 0) {
        const uncategorizedProducts = brandProducts.filter(product => {
          // Check if this product is not already in a category
          return !formattedCategories.some(category => 
            category.products.some(p => p.id === product.id)
          );
        });
        
        if (uncategorizedProducts.length > 0) {
          console.log(`Found ${uncategorizedProducts.length} uncategorized products`);
          
          // Add an "Uncategorized" category
          formattedCategories.unshift({
            id: 0, // Special ID for uncategorized
            name: "Uncategorized",
            description: "Products without a category",
            products: uncategorizedProducts.map(product => ({
              id: product.id,
              name: product.name,
              description: product.description || ""
            }))
          });
        }
      }
      
      setCategories(formattedCategories);
      
      // Success toast
      toast({
        title: "Products Loaded",
        description: `Loaded ${brandProducts.length} products in ${formattedCategories.length} categories`,
      });
    } catch (error) {
      console.error("Failed to fetch brand products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    }
    
    // Open the edit dialog to show products
    setIsEditDialogOpen(true);
  };
  
  // Category management functions
  const handleAddCategory = () => {
    if (!categoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setCategories([
      ...categories,
      {
        name: categoryName,
        description: categoryDescription,
        products: []
      }
    ]);
    
    // Reset category form
    setCategoryName("");
    setCategoryDescription("");
    setShowCategoryForm(false);
    
    toast({
      title: "Success",
      description: `Category "${categoryName}" added to brand.`,
    });
  };
  
  const handleRemoveCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
    
    toast({
      title: "Success",
      description: "Category removed.",
    });
  };
  
  const openProductForm = (categoryIndex: number) => {
    setSelectedCategoryIndex(categoryIndex);
    setShowProductForm(true);
  };
  
  const handleAddProduct = async () => {
    if (selectedCategoryIndex === null) return;
    
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "Product name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add the product to the local state
      const newCategories = [...categories];
      newCategories[selectedCategoryIndex].products.push({
        id: Math.floor(Math.random() * -1000) - 1, // Temporary negative ID for new products
        name: productName,
        description: productDescription || ""
      });
      setCategories(newCategories);
      
      // Reset product form
      setProductName("");
      setProductDescription("");
      setShowProductForm(false);
      
      toast({
        title: "Success",
        description: `Product "${productName}" added to ${categories[selectedCategoryIndex].name}.`,
      });
      
      // Note: The product will be saved to the database when the brand is created or updated
      // This allows adding products to categories that don't exist in the database yet
    } catch (error) {
      console.error("Failed to add product:", error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveProduct = async (categoryIndex: number, productIndex: number) => {
    const newCategories = [...categories];
    const product = newCategories[categoryIndex].products[productIndex];
    const productName = product.name;
    
    // Only attempt to delete from database if the product has an ID (exists in database)
    if (product.id) {
      setIsSubmitting(true);
      
      try {
        console.log(`Deleting product with ID: ${product.id}`);
        await brandAPI.deleteProduct(product.id);
        
        // Remove from local state after successful deletion
        newCategories[categoryIndex].products.splice(productIndex, 1);
        setCategories(newCategories);
        
        toast({
          title: "Success",
          description: `Product "${productName}" removed from database.`,
        });
      } catch (error) {
        console.error("Failed to delete product:", error);
        toast({
          title: "Error",
          description: "Failed to delete product from database. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Product doesn't exist in database yet, just remove from local state
      newCategories[categoryIndex].products.splice(productIndex, 1);
      setCategories(newCategories);
      
      toast({
        title: "Success",
        description: `Product "${productName}" removed.`,
      });
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Brand Management</h1>
          <p className="text-muted-foreground">
            Manage brands and their products
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </div>
      
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search brands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Brands Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-center mb-2">No brands found</p>
            <p className="text-muted-foreground text-center">
              {searchTerm ? "Try a different search term" : "Create your first brand to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <CardTitle>{brand.name}</CardTitle>
                </div>
                <CardDescription>
                  {brand.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Products: {brand.product_count || 0}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(brand)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openDeleteDialog(brand)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <Button size="sm" onClick={() => navigateToProducts(brand)}>
                  <Package className="w-4 h-4 mr-1" />
                  Products
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Brand Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Brand</DialogTitle>
            <DialogDescription>
              Add a new brand to the system. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brandDescription">Description</Label>
              <Textarea
                id="brandDescription"
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Enter brand description"
                disabled={isSubmitting}
              />
            </div>

            
            {/* Categories Section */}
            <div className="border-t pt-4 mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Categories</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCategoryForm(true)}
                  disabled={isSubmitting || showCategoryForm}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Category
                </Button>
              </div>
              
              {/* Category Form */}
              {showCategoryForm && (
                <div className="bg-muted p-4 rounded-md mb-4">
                  <h4 className="font-medium mb-2">New Category</h4>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="categoryName">Category Name *</Label>
                      <Input
                        id="categoryName"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Textarea
                        id="categoryDescription"
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        placeholder="Enter category description"
                        disabled={isSubmitting}
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCategoryName("");
                          setCategoryDescription("");
                          setShowCategoryForm(false);
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCategory}
                        disabled={isSubmitting || !categoryName.trim()}
                      >
                        Add Category
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Categories List */}
              {categories.length > 0 ? (
                <div className="space-y-3">
                  {categories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Products: {category.products.length}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openProductForm(categoryIndex)}
                            disabled={isSubmitting}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Product
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCategory(categoryIndex)}
                            disabled={isSubmitting}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Products List */}
                      {category.products.length > 0 && (
                        <div className="mt-3 border-t pt-2">
                          <h5 className="text-sm font-medium mb-2">Products</h5>
                          <div className="space-y-2">
                            {category.products.map((product, productIndex) => (
                              <div key={productIndex} className="bg-muted/30 rounded-md p-2 flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{product.name}</div>
                                  {product.description && (
                                    <div className="text-xs text-muted-foreground">{product.description}</div>
                                  )}

                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(categoryIndex, productIndex)}
                                  disabled={isSubmitting}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No categories added yet. Add a category to organize products.
                </div>
              )}
              
              {/* Product Form */}
              {showProductForm && selectedCategoryIndex !== null && (
                <div className="bg-muted p-4 rounded-md mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Add Product to {categories[selectedCategoryIndex].name}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProductForm(false)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Enter product name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="productDescription">Description</Label>
                      <Textarea
                        id="productDescription"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Enter product description"
                        disabled={isSubmitting}
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProductForm(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddProduct}
                        disabled={isSubmitting || !productName.trim()}
                      >
                        Add Product
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBrand} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Brand
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Brand Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Update brand information and manage products. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editBrandName">Brand Name *</Label>
              <Input
                id="editBrandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editBrandDescription">Description</Label>
              <Textarea
                id="editBrandDescription"
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Enter brand description"
                disabled={isSubmitting}
              />
            </div>

            {/* Categories Section */}
            <div className="border-t pt-4 mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Categories</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCategoryForm(true)}
                  disabled={isSubmitting || showCategoryForm}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Category
                </Button>
              </div>
              
              {/* Category Form */}
              {showCategoryForm && (
                <div className="bg-muted p-4 rounded-md mb-4">
                  <h4 className="font-medium mb-2">New Category</h4>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="categoryName">Category Name *</Label>
                      <Input
                        id="categoryName"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Textarea
                        id="categoryDescription"
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        placeholder="Enter category description"
                        disabled={isSubmitting}
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCategoryName("");
                          setCategoryDescription("");
                          setShowCategoryForm(false);
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCategory}
                        disabled={isSubmitting || !categoryName.trim()}
                      >
                        Add Category
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Categories List */}
              {categories.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No categories added yet. Add a category to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category, categoryIndex) => (
                    <Card key={categoryIndex}>
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{category.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openProductForm(categoryIndex)}
                              disabled={isSubmitting}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => handleRemoveCategory(categoryIndex)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {category.description && (
                          <CardDescription>{category.description}</CardDescription>
                        )}
                      </CardHeader>
                      
                      {/* Products List */}
                      <CardContent className="py-0">
                        {category.products.length === 0 ? (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            No products in this category
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {category.products.map((product, productIndex) => (
                              <div 
                                key={productIndex}
                                className="flex justify-between items-center p-2 bg-muted rounded-md"
                              >
                                <div>
                                  <p className="font-medium text-sm">{product.name}</p>
                                  {product.description && (
                                    <p className="text-xs text-muted-foreground">{product.description}</p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => handleRemoveProduct(categoryIndex, productIndex)}
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Product Form */}
              {showProductForm && selectedCategoryIndex !== null && (
                <div className="bg-muted p-4 rounded-md mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Add Product to {categories[selectedCategoryIndex].name}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProductForm(false)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Enter product name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="productDescription">Description</Label>
                      <Textarea
                        id="productDescription"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Enter product description"
                        disabled={isSubmitting}
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProductForm(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddProduct}
                        disabled={isSubmitting || !productName.trim()}
                      >
                        Add Product
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBrand} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Update Brand
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Brand Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the brand "{selectedBrand?.name}" and all its products.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrandManagement;