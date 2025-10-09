import React, { useState } from 'react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  User, 
  Settings, 
  FileText, 
  ShoppingCart,
  Heart,
  Star,
  Zap
} from 'lucide-react';

export function ResponsiveModalExamples() {
  const [openModals, setOpenModals] = useState<Record<string, boolean>>({});

  const toggleModal = (modalName: string) => {
    setOpenModals(prev => ({
      ...prev,
      [modalName]: !prev[modalName]
    }));
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">ResponsiveModal Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Small Modal - Minimal Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Small Modal (Minimal)</h3>
          <Button 
            onClick={() => toggleModal('small')}
            className="w-full"
          >
            Open Small Modal
          </Button>
          
          <ResponsiveModal
            open={openModals.small || false}
            onOpenChange={() => toggleModal('small')}
            title="Small Modal"
            description="This is a small modal with minimal design"
            icon={<FileText className="h-6 w-6 text-white" />}
            size="sm"
            variant="minimal"
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <Button className="w-full">Submit</Button>
            </div>
          </ResponsiveModal>
        </div>

        {/* Medium Modal - Professional Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Medium Modal (Professional)</h3>
          <Button 
            onClick={() => toggleModal('medium')}
            className="w-full"
            variant="outline"
          >
            Open Medium Modal
          </Button>
          
          <ResponsiveModal
            open={openModals.medium || false}
            onOpenChange={() => toggleModal('medium')}
            title="Professional Modal"
            description="This modal has a professional design with subtle patterns"
            icon={<Settings className="h-6 w-6 text-white" />}
            size="md"
            variant="professional"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Acme Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Your message here..." />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save</Button>
              </div>
            </div>
          </ResponsiveModal>
        </div>

        {/* Large Modal - Colorful Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Large Modal (Colorful)</h3>
          <Button 
            onClick={() => toggleModal('large')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
          >
            Open Large Modal
          </Button>
          
          <ResponsiveModal
            open={openModals.large || false}
            onOpenChange={() => toggleModal('large')}
            title="Colorful Modal"
            description="This modal has vibrant colors and animated elements"
            icon={<Heart className="h-6 w-6 text-white" />}
            size="lg"
            variant="colorful"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product Name</Label>
                  <Input id="product" placeholder="Enter product name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Product description..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input id="minStock" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStock">Max Stock</Label>
                  <Input id="maxStock" type="number" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600">Create Product</Button>
              </div>
            </div>
          </ResponsiveModal>
        </div>

        {/* Extra Large Modal - Default Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">XL Modal (Default)</h3>
          <Button 
            onClick={() => toggleModal('xl')}
            className="w-full"
            variant="secondary"
          >
            Open XL Modal
          </Button>
          
          <ResponsiveModal
            open={openModals.xl || false}
            onOpenChange={() => toggleModal('xl')}
            title="Extra Large Modal"
            description="This modal is extra large and perfect for complex forms"
            icon={<ShoppingCart className="h-6 w-6 text-white" />}
            size="xl"
            variant="default"
          >
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" placeholder="Customer name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="Phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Email address" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="Full address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional notes" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item1">Item 1</Label>
                  <Input id="item1" placeholder="Item name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty1">Quantity</Label>
                  <Input id="qty1" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price1">Price</Label>
                  <Input id="price1" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total1">Total</Label>
                  <Input id="total1" type="number" placeholder="0.00" disabled />
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: $0.00
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">Save Draft</Button>
                  <Button>Create Order</Button>
                </div>
              </div>
            </div>
          </ResponsiveModal>
        </div>

        {/* 2XL Modal - Colorful Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">2XL Modal (Colorful)</h3>
          <Button 
            onClick={() => toggleModal('2xl')}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            Open 2XL Modal
          </Button>
          
          <ResponsiveModal
            open={openModals['2xl'] || false}
            onOpenChange={() => toggleModal('2xl')}
            title="Extra Extra Large Modal"
            description="This is the largest modal size with colorful design"
            icon={<Star className="h-6 w-6 text-white" />}
            size="2xl"
            variant="colorful"
          >
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="field1">Field 1</Label>
                  <Input id="field1" placeholder="Value 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field2">Field 2</Label>
                  <Input id="field2" placeholder="Value 2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field3">Field 3</Label>
                  <Input id="field3" placeholder="Value 3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field4">Field 4</Label>
                  <Input id="field4" placeholder="Value 4" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="textarea1">Large Text Area 1</Label>
                  <Textarea id="textarea1" placeholder="Enter detailed information..." className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textarea2">Large Text Area 2</Label>
                  <Textarea id="textarea2" placeholder="Enter more details..." className="min-h-[100px]" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="select1">Select Option 1</Label>
                  <Input id="select1" placeholder="Choose option" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="select2">Select Option 2</Label>
                  <Input id="select2" placeholder="Choose option" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="select3">Select Option 3</Label>
                  <Input id="select3" placeholder="Choose option" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" size="lg">Cancel</Button>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Zap className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              </div>
            </div>
          </ResponsiveModal>
        </div>

        {/* Full Width Modal - Professional Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Full Width Modal</h3>
          <Button 
            onClick={() => toggleModal('full')}
            className="w-full"
            variant="destructive"
          >
            Open Full Width Modal
          </Button>
          
          <ResponsiveModal
            open={openModals.full || false}
            onOpenChange={() => toggleModal('full')}
            title="Full Width Modal"
            description="This modal takes up most of the screen width"
            icon={<Package className="h-6 w-6 text-white" />}
            size="full"
            variant="professional"
          >
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Label htmlFor={`field${i + 1}`}>Field {i + 1}</Label>
                    <Input id={`field${i + 1}`} placeholder={`Value ${i + 1}`} />
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="largeText1">Large Text Area 1</Label>
                  <Textarea id="largeText1" placeholder="Enter detailed information..." className="min-h-[120px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="largeText2">Large Text Area 2</Label>
                  <Textarea id="largeText2" placeholder="Enter more details..." className="min-h-[120px]" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" size="lg">Cancel</Button>
                <Button size="lg">Save Changes</Button>
              </div>
            </div>
          </ResponsiveModal>
        </div>
      </div>
    </div>
  );
}
